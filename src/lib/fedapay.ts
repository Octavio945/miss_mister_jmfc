// src/lib/fedapay.ts
// Accès à l'API FedaPay et confirmation des paiements.
//
// Règle de sécurité : un paiement n'est JAMAIS validé sur la foi d'une notification reçue
// (webhook) ou d'un message du navigateur. On interroge toujours FedaPay avec la clé secrète
// et on vérifie identifiant + montant avant d'ajouter les votes.

import { prisma } from "@/lib/prisma";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";

type FedapayStatus = "pending" | "approved" | "declined" | "canceled" | "refunded" | "transferred" | string;

interface FedapayTransaction {
  id: number;
  status: FedapayStatus;
  amount: number;
  mode?: string | null;
}

export class FedapayError extends Error {
  constructor(message: string, readonly details?: unknown) {
    super(message);
  }
}

function getSecretKey(): string {
  const key = process.env.FEDAPAY_SECRET_KEY;
  if (!key) throw new FedapayError("FEDAPAY_SECRET_KEY n'est pas configurée.");
  return key;
}

/**
 * Les clés sandbox commencent par sk_sandbox_ ; tout le reste vise l'API de production.
 * FEDAPAY_API_URL permet de pointer vers un faux FedaPay local pour les tests (à ne pas définir en production).
 */
function getApiUrl(): string {
  if (process.env.FEDAPAY_API_URL) return process.env.FEDAPAY_API_URL.replace(/\/$/, "");
  return getSecretKey().startsWith("sk_sandbox_")
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";
}

async function fedapayRequest(path: string, init?: RequestInit): Promise<FedapayTransaction> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const raw = await res.json().catch(() => null);
  if (!res.ok) {
    throw new FedapayError(`FedaPay a répondu ${res.status}`, raw);
  }
  // FedaPay imbrique l'objet sous la clé "v1/transaction"
  const transaction = raw?.["v1/transaction"] ?? raw;
  if (!transaction?.id) throw new FedapayError("Réponse FedaPay inattendue", raw);
  return transaction as FedapayTransaction;
}

export function createFedapayTransaction(input: {
  amount: number;
  description: string;
  reference: string;
  callbackUrl: string;
  customer: { firstname: string; email?: string | null; phone?: string | null };
}) {
  return fedapayRequest("/transactions", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(input.amount),
      currency: { iso: "XOF" },
      description: input.description,
      callback_url: input.callbackUrl,
      customer: {
        firstname: input.customer.firstname,
        lastname: "",
        // FedaPay exige un email : adresse technique (format de l'ancienne version en production)
        email: input.customer.email || `vote_${input.reference.substring(0, 8)}@temp.com`,
      },
    }),
  });
}

export function fetchFedapayTransaction(fedapayId: string) {
  if (!/^\d+$/.test(fedapayId)) throw new FedapayError("Identifiant FedaPay invalide.");
  return fedapayRequest(`/transactions/${fedapayId}`);
}

const SUCCESS_STATUSES = new Set(["approved", "transferred"]);
const FAILED_STATUSES = new Set(["declined", "canceled", "refunded"]);

export type SyncResult = "SUCCESS" | "FAILED" | "PENDING" | "NOT_FOUND";

/**
 * Met une transaction de notre base en accord avec FedaPay.
 * Idempotent : appelée par le webhook, la page d'attente et l'admin sans risque de double vote.
 */
export async function syncTransactionWithFedapay(where: { reference: string } | { fedapayId: string }): Promise<SyncResult> {
  const tx = await prisma.transaction.findUnique({
    where,
    include: { items: { include: { participant: true } } },
  });
  if (!tx) return "NOT_FOUND";
  // Une transaction FAILED reste vérifiable : un votant peut payer après un rejet ou un abandon,
  // et un paiement réellement reçu doit toujours compter.
  if (tx.status === "SUCCESS" || !tx.fedapayId) return tx.status;

  const remote = await fetchFedapayTransaction(tx.fedapayId);

  if (String(remote.id) !== tx.fedapayId) {
    throw new FedapayError("Identifiant FedaPay différent de celui enregistré.");
  }

  if (SUCCESS_STATUSES.has(remote.status)) {
    // Le montant payé doit correspondre exactement au montant attendu
    if (Math.round(remote.amount) !== Math.round(tx.amount)) {
      console.error(`❌ Montant incohérent pour ${tx.reference} : attendu ${tx.amount}, FedaPay ${remote.amount}`);
      await sendTelegramNotification(
        `⚠️ <b>Paiement à vérifier</b>\nRéf : <code>${tx.reference}</code>\nMontant attendu ${tx.amount} FCFA, reçu ${remote.amount} FCFA. Aucun vote ajouté.`
      );
      return "PENDING";
    }

    // Statut + votes dans une seule transaction ; WHERE status=PENDING = verrou anti double vote
    const credited = await prisma.$transaction(async (db) => {
      const claimed = await db.transaction.updateMany({
        where: { id: tx.id, status: { in: ["PENDING", "FAILED"] } },
        data: { status: "SUCCESS", paidAt: new Date(), paymentMethod: remote.mode || "FEDAPAY" },
      });
      if (claimed.count === 0) return false;
      for (const item of tx.items) {
        await db.participant.update({
          where: { id: item.participantId },
          data: { totalVotes: { increment: item.numberOfVotes } },
        });
      }
      return true;
    });

    if (credited) {
      const lines = tx.items
        .map((i) => `👤 <b>Candidat :</b> ${escapeHtml(i.participant.name)} (+${i.numberOfVotes} vote${i.numberOfVotes > 1 ? "s" : ""})`)
        .join("\n");
      await sendTelegramNotification(
        `✅ <b>Paiement FedaPay réussi</b>\n${lines}\n💰 <b>Montant :</b> ${tx.amount.toLocaleString("fr-FR")} FCFA\n📋 <b>Réf :</b> <code>${tx.reference}</code>`
      );
    }
    return "SUCCESS";
  }

  if (FAILED_STATUSES.has(remote.status)) {
    await prisma.transaction.updateMany({
      where: { id: tx.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
    return "FAILED";
  }

  return "PENDING";
}
