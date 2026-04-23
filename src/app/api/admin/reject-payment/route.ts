import { prisma } from "@/lib/prisma";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!(await requireAdminAuth())) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "ID de transaction manquant." },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction introuvable." },
        { status: 404 }
      );
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json(
        { error: "Seules les transactions en attente peuvent être rejetées." },
        { status: 400 }
      );
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "FAILED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/reject-payment]", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du rejet." },
      { status: 500 }
    );
  }
}
