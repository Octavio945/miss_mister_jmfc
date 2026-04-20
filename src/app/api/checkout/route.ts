// src/app/api/checkout/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

/**
 * Convertit les erreurs techniques FedaPay en messages lisibles pour l'utilisateur.
 * On ne veut jamais afficher un message d'API brut à l'écran.
 */
function toUserFriendlyError(fedapayError: unknown): string {
  const raw = typeof fedapayError === "string"
    ? fedapayError.toLowerCase()
    : JSON.stringify(fedapayError ?? "").toLowerCase();

  if (raw.includes("limit") || raw.includes("quota") || raw.includes("maximum") || raw.includes("exceeded")) {
    return "Le service de paiement est temporairement indisponible en raison d'une maintenance. Veuillez réessayer dans quelques minutes.";
  }
  if (raw.includes("amount") || raw.includes("montant") || raw.includes("minimum")) {
    return "Le montant saisi n'est pas valide. Veuillez vérifier le nombre de votes et réessayer.";
  }
  if (raw.includes("customer") || raw.includes("email") || raw.includes("phone")) {
    return "Vos informations de contact semblent incorrectes. Veuillez les vérifier et réessayer.";
  }
  if (raw.includes("unauthorized") || raw.includes("forbidden") || raw.includes("auth")) {
    return "Le service de paiement est temporairement indisponible. Nos équipes sont informées. Réessayez dans quelques instants.";
  }
  if (raw.includes("timeout") || raw.includes("network") || raw.includes("connect")) {
    return "La connexion au service de paiement a été interrompue. Vérifiez votre connexion internet et réessayez.";
  }
  return "Le paiement n'a pas pu être initié en raison d'une maintenance. Veuillez patienter quelques minutes et réessayer.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { participantId, voteCount, voterName, voterPhone, voterEmail, isAnonymous } = body;

    // 1. Vérifications
    if (!participantId || !voteCount || typeof voteCount !== "number" || voteCount < 1) {
      return NextResponse.json(
        { error: "Paramètres invalides : l'ID du candidat et un nombre de votes positif sont requis." },
        { status: 400 }
      );
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { event: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant introuvable." }, { status: 404 });
    }

    if (!participant.event.isActive) {
      return NextResponse.json(
        { error: "L'événement de vote n'est plus actif." },
        { status: 403 }
      );
    }

    // 2. Créer ou trouver le voter
    // FIX Bug 1 : recherche par phone OU email pour éviter les doublons
    let voter;
    let anonCode: string | null = null;

    if (isAnonymous) {
      anonCode = `VOTER-${nanoid(6).toUpperCase()}`;
      voter = await prisma.voter.create({ data: { isAnonymous: true, anonCode } });
    } else {
      // Construire les conditions de recherche dynamiquement
      const orConditions: object[] = [];
      if (voterPhone) orConditions.push({ phone: voterPhone });
      if (voterEmail) orConditions.push({ email: voterEmail });

      if (orConditions.length > 0) {
        voter = await prisma.voter.findFirst({
          where: {
            isAnonymous: false,
            OR: orConditions,
          },
        });
      }

      if (!voter) {
        voter = await prisma.voter.create({
          data: {
            name: voterName || null,
            phone: voterPhone || null,
            email: voterEmail || null,
            isAnonymous: false,
          },
        });
      } else {
        // Mettre à jour le nom si fourni et absent
        if (voterName && !voter.name) {
          voter = await prisma.voter.update({
            where: { id: voter.id },
            data: { name: voterName },
          });
        }
      }
    }

    // 3. Calculer le montant
    const votePrice = participant.event.votePrice ?? 100;
    const amount = voteCount * votePrice;

    // ✅ NOUVELLE VÉRIFICATION : Montant minimum FedaPay (100 XOF)
    if (amount < 100) {
      return NextResponse.json(
        { error: `Le montant total (${amount} XOF) est inférieur au minimum autorisé par FedaPay (100 XOF). Veuillez augmenter le nombre de votes.` },
        { status: 400 }
      );
    }

    const reference = `TX-${nanoid(12).toUpperCase()}`;

    // 4. Créer la transaction PENDING dans la BDD
    const transaction = await prisma.transaction.create({
      data: {
        eventId: participant.eventId,
        voterId: voter.id,
        reference,
        amount,
        currency: "XOF",
        status: "PENDING",
        items: {
          create: {
            participantId: participant.id,
            numberOfVotes: voteCount,
            amount,
          },
        },
      },
    });

    // 5. Appel à FedaPay
    const secretKey = process.env.FEDAPAY_SECRET_KEY;
    const isSandbox = secretKey?.includes("sandbox");
    const apiUrl = isSandbox
      ? "https://sandbox-api.fedapay.com/v1"
      : "https://api.fedapay.com/v1";

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    console.log("🔄 Création transaction FedaPay...");

    const fedapayResponse = await fetch(`${apiUrl}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency: { iso: "XOF" },
        description: `${voteCount} vote(s) pour ${participant.name}`,
        reference: reference,
        callback_url: `${baseUrl}/api/fedapay-webhook`,
        customer: {
          firstname: voter.name || "Votant",
          lastname: "",
          email: voter.email || `vote_${reference.substring(0, 8)}@temp.com`,
        },
      }),
    });

    const fedapayRaw = await fedapayResponse.json();

    if (!fedapayResponse.ok) {
      console.error("❌ Erreur FedaPay:", fedapayRaw);
      await prisma.transaction.delete({ where: { id: transaction.id } });
      return NextResponse.json(
        { error: toUserFriendlyError(fedapayRaw.message ?? fedapayRaw) },
        { status: 503 }
      );
    }

    // FedaPay retourne l'objet imbriqué sous la clé "v1/transaction"
    const fedapayTransaction = fedapayRaw["v1/transaction"] ?? fedapayRaw;
    const fedapayTransactionId = String(fedapayTransaction?.id ?? "");

    console.log("✅ Transaction FedaPay créée:", fedapayTransactionId);

    // Enregistrer l'ID FedaPay dans notre BDD
    if (fedapayTransactionId) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { fedapayId: fedapayTransactionId },
      });
      console.log("💾 ID FedaPay lié à la transaction BDD");
    }

    // 6. Retourner les infos au frontend
    // FIX Bug 2 : on ne retourne PLUS fedapayTransactionId au client
    // Le frontend récupérera le fedapayId via /api/checkout/init-popup
    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      voterId: voter.id,
      anonCode: anonCode,
      // fedapayTransactionId retiré intentionnellement pour la sécurité
    });
  } catch (error) {
    console.error("[POST /api/checkout]", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite. Veuillez réessayer dans quelques instants." },
      { status: 500 }
    );
  }
}