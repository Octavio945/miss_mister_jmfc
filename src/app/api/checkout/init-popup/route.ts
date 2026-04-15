// src/app/api/checkout/init-popup/route.ts
// NOUVEAU FICHIER — récupère le fedapayId depuis la référence (ne l'expose jamais dans l'URL)

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get("ref");

    if (!ref) {
      return NextResponse.json({ error: "Référence manquante." }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { reference: ref },
      select: {
        fedapayId: true,
        amount: true,
        status: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });
    }

    // FIX Bug 2 : on refuse de retourner le fedapayId si la transaction
    // est déjà traitée — évite la réutilisation d'une session expirée
    if (transaction.status === "SUCCESS") {
      return NextResponse.json(
        { error: "Cette transaction a déjà été réglée." },
        { status: 409 }
      );
    }

    if (transaction.status === "FAILED") {
      return NextResponse.json(
        { error: "Cette transaction a échoué. Veuillez recommencer." },
        { status: 410 }
      );
    }

    if (!transaction.fedapayId) {
      return NextResponse.json(
        { error: "Session de paiement introuvable. Veuillez recommencer." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      fedapayId: Number(transaction.fedapayId),
      amount: transaction.amount,
    });
  } catch (error) {
    console.error("[GET /api/checkout/init-popup]", error);
    return NextResponse.json({ error: "Erreur serveur interne." }, { status: 500 });
  }
}