import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createFedapayTransaction, FedapayError } from "@/lib/fedapay";

// Garde-fou contre les saisies aberrantes (ex : 1e9 votes)
const MAX_VOTES_PER_TRANSACTION = 10000;

// Les erreurs techniques de FedaPay ne sont jamais montrées telles quelles au votant
const PAYMENT_UNAVAILABLE =
  "Le service de paiement est momentanément indisponible. Veuillez réessayer dans quelques minutes.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { participantId, voteCount, voterName, voterPhone, voterEmail, isAnonymous } = body;

    if (
      typeof participantId !== "string" ||
      !Number.isInteger(voteCount) ||
      voteCount < 1 ||
      voteCount > MAX_VOTES_PER_TRANSACTION
    ) {
      return NextResponse.json(
        {
          error: `Paramètres invalides : l'ID du candidat et un nombre entier de votes (1 à ${MAX_VOTES_PER_TRANSACTION}) sont requis.`,
        },
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

    // Mêmes règles que l'affichage du VotePanel : actif ET dans la période de vote
    const now = new Date();
    if (
      !participant.event.isActive ||
      now < participant.event.startDate ||
      now > participant.event.endDate
    ) {
      return NextResponse.json({ error: "Les votes ne sont pas ouverts actuellement." }, { status: 403 });
    }

    // Créer ou trouver le voter
    let voter;
    let anonCode: string | null = null;

    if (isAnonymous) {
      anonCode = `VOTER-${nanoid(6).toUpperCase()}`;
      voter = await prisma.voter.create({ data: { isAnonymous: true, anonCode } });
    } else {
      const orConditions: object[] = [];
      if (voterPhone) orConditions.push({ phone: voterPhone });
      if (voterEmail) orConditions.push({ email: voterEmail });

      if (orConditions.length > 0) {
        voter = await prisma.voter.findFirst({
          where: { isAnonymous: false, OR: orConditions },
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
      } else if (voterName && !voter.name) {
        voter = await prisma.voter.update({
          where: { id: voter.id },
          data: { name: voterName },
        });
      }
    }

    const votePrice = participant.event.votePrice ?? 100;
    const amount = voteCount * votePrice;

    if (amount < 100) {
      return NextResponse.json(
        { error: `Le montant total (${amount} XOF) est inférieur au minimum autorisé (100 XOF).` },
        { status: 400 }
      );
    }

    const reference = `TX-${nanoid(12).toUpperCase()}`;

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

    // Session de paiement FedaPay. En cas d'échec, la transaction locale est supprimée :
    // aucun votant ne reste bloqué sur une transaction impossible à payer.
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    try {
      const fedapayTransaction = await createFedapayTransaction({
        amount,
        description: `${voteCount} vote(s) pour ${participant.name.trim()}`,
        reference,
        // Redirection éventuelle après paiement : la page d'attente vérifie le statut
        callbackUrl: `${baseUrl}/checkout?ref=${reference}`,
        customer: { firstname: voter.name || "Votant", email: voter.email },
      });
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { fedapayId: String(fedapayTransaction.id) },
      });
    } catch (error) {
      console.error("❌ Création FedaPay impossible:", error instanceof FedapayError ? error.details ?? error.message : error);
      await prisma.transaction.delete({ where: { id: transaction.id } });
      return NextResponse.json({ error: PAYMENT_UNAVAILABLE }, { status: 503 });
    }

    // L'identifiant FedaPay n'est pas renvoyé ici : la page de paiement le demande à /api/checkout/init-popup
    return NextResponse.json({
      success: true,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      anonCode,
    });
  } catch (error) {
    console.error("[POST /api/checkout]", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite. Veuillez réessayer dans quelques instants." },
      { status: 500 }
    );
  }
}
