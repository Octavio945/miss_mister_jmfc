import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createHmac } from "crypto";

const FEDAPAY_SECRET = process.env.FEDAPAY_SECRET_KEY ?? "";

/**
 * POST /api/webhooks/payment
 * Endpoint appelé par FedaPay quand un paiement est confirmé.
 * Vérifie la signature HMAC, puis crédite les votes au participant.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-fedapay-signature") ?? "";

    // ── Vérification de la signature HMAC-SHA256 ─────────────────────────────
    if (FEDAPAY_SECRET) {
      const expected = createHmac("sha256", FEDAPAY_SECRET)
        .update(rawBody)
        .digest("hex");

      if (signature !== expected) {
        console.warn("[Webhook] Signature invalide reçue.");
        return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // FedaPay envoie un objet avec `event` (ex: "transaction.approved")
    // et `data.reference` qui correspond à notre référence interne
    const eventType: string = payload.event ?? payload.type ?? "";
    const externalRef: string =
      payload?.data?.reference ??
      payload?.reference ??
      "";

    if (!eventType.includes("approved") && !eventType.includes("success")) {
      // On ignore les autres événements (paiement initié, expiré, etc.)
      return NextResponse.json({ received: true });
    }

    if (!externalRef) {
      return NextResponse.json({ error: "Référence manquante." }, { status: 400 });
    }

    // ── Retrouver la transaction ─────────────────────────────────────────────
    const transaction = await prisma.transaction.findUnique({
      where: { reference: externalRef },
      include: { items: true },
    });

    if (!transaction) {
      console.error(`[Webhook] Transaction introuvable pour ref=${externalRef}`);
      return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });
    }

    if (transaction.status === "SUCCESS") {
      // Idempotence : déjà traité
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    // ── Mettre à jour la transaction et créditer les votes ───────────────────
    await prisma.$transaction(async (tx) => {
      // 1. Marquer la transaction SUCCESS
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: "SUCCESS", paidAt: new Date() },
      });

      // 2. Pour chaque item, ajouter les votes au participant
      for (const item of transaction.items) {
        await tx.participant.update({
          where: { id: item.participantId },
          data: { totalVotes: { increment: item.numberOfVotes } },
        });
      }
    });

    console.log(`✅ [Webhook] Transaction ${externalRef} confirmée.`);
    return NextResponse.json({ received: true, success: true });
  } catch (error) {
    console.error("[POST /api/webhooks/payment]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
