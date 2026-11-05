// src/app/api/checkout/init-popup/route.ts
// Donne à la page de paiement l'identifiant de session FedaPay correspondant à une référence.

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const ref = new URL(request.url).searchParams.get("ref");
    if (!ref) {
      return NextResponse.json({ error: "Référence manquante." }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { reference: ref },
      select: { fedapayId: true, amount: true, status: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });
    }
    // Une transaction déjà traitée ne doit pas rouvrir de paiement
    if (transaction.status === "SUCCESS") {
      return NextResponse.json({ error: "Cette transaction a déjà été réglée." }, { status: 409 });
    }
    if (transaction.status === "FAILED") {
      return NextResponse.json({ error: "Cette transaction a échoué. Veuillez recommencer." }, { status: 410 });
    }
    if (!transaction.fedapayId) {
      return NextResponse.json({ error: "Session de paiement introuvable. Veuillez recommencer." }, { status: 404 });
    }

    return NextResponse.json({ fedapayId: Number(transaction.fedapayId), amount: transaction.amount });
  } catch (error) {
    console.error("[GET /api/checkout/init-popup]", error);
    return NextResponse.json({ error: "Erreur serveur interne." }, { status: 500 });
  }
}
