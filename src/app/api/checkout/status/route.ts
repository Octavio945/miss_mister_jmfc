import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get("ref");

    if (!ref) {
      return NextResponse.json(
        { error: "Référence manquante." },
        { status: 400 }
      );
    }

    // ✅ Récupérer la transaction avec son vrai statut (TxStatus)
    const transaction = await prisma.transaction.findUnique({
      where: { reference: ref },
      select: { 
        id: true, 
        status: true,
        paidAt: true 
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction introuvable." },
        { status: 404 }
      );
    }

    // Retourner le statut (PENDING, SUCCESS, FAILED)
    return NextResponse.json({ status: transaction.status });

  } catch (error) {
    console.error("[GET /api/checkout/status]", error);
    return NextResponse.json(
      { error: "Erreur serveur interne." },
      { status: 500 }
    );
  }
}