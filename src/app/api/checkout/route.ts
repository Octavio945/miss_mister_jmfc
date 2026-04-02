import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

const VOTE_PRICE_XOF = 100; // 100 FCFA par vote

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { participantId, voteCount, voterName, voterPhone, voterEmail, isAnonymous } = body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!participantId || !voteCount || typeof voteCount !== "number" || voteCount < 1) {
      return NextResponse.json(
        { error: "participantId et voteCount (≥ 1) sont requis." },
        { status: 400 }
      );
    }

    // ── Récupérer le participant et l'événement ──────────────────────────────
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { event: true },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant introuvable." },
        { status: 404 }
      );
    }

    if (!participant.event.isActive) {
      return NextResponse.json(
        { error: "L'événement de vote n'est plus actif." },
        { status: 403 }
      );
    }

    // ── Créer ou retrouver le votant ─────────────────────────────────────────
    let voter;

    if (isAnonymous) {
      const anonCode = `VOTER-${nanoid(6).toUpperCase()}`;
      voter = await prisma.voter.create({
        data: { isAnonymous: true, anonCode },
      });
    } else {
      // Cherche un votant existant par téléphone, sinon crée-le
      if (voterPhone) {
        voter = await prisma.voter.findFirst({ where: { phone: voterPhone } });
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
      }
    }

    // ── Calculer le montant ──────────────────────────────────────────────────
    const amount = voteCount * VOTE_PRICE_XOF;
    const reference = `TX-${nanoid(12).toUpperCase()}`;

    // ── Créer la transaction PENDING ─────────────────────────────────────────
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

    // ── TODO Phase 2+ : Appeler FedaPay ici pour obtenir une redirectUrl ─────
    // Pour l'instant on retourne la référence pour que le frontend puisse
    // simuler ou appeler FedaPay côté client.
    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      voterId: voter.id,
      anonCode: voter.isAnonymous ? voter.anonCode : null,
      // paymentUrl: await createFedaPayLink(transaction)  ← à brancher
    });
  } catch (error) {
    console.error("[POST /api/checkout]", error);
    return NextResponse.json(
      { error: "Erreur serveur interne." },
      { status: 500 }
    );
  }
}
