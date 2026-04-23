import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { participantId, voteCount, voterName, voterPhone, voterEmail, isAnonymous, network } = body;

    if (!participantId || !voteCount || typeof voteCount !== "number" || voteCount < 1) {
      return NextResponse.json(
        { error: "Paramètres invalides : l'ID du candidat et un nombre de votes positif sont requis." },
        { status: 400 }
      );
    }

    if (!network || !["MTN", "CELTIS"].includes(network)) {
      return NextResponse.json(
        { error: "Veuillez choisir un réseau de paiement (MTN ou Celtis)." },
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
      return NextResponse.json({ error: "L'événement de vote n'est plus actif." }, { status: 403 });
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
        network,
        items: {
          create: {
            participantId: participant.id,
            numberOfVotes: voteCount,
            amount,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      voterId: voter.id,
      anonCode: anonCode,
      network,
    });
  } catch (error) {
    console.error("[POST /api/checkout]", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite. Veuillez réessayer dans quelques instants." },
      { status: 500 }
    );
  }
}
