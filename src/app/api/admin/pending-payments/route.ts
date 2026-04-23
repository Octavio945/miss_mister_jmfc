import { prisma } from "@/lib/prisma";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await requireAdminAuth())) {
    return unauthorizedResponse();
  }

  try {
    const pending = await prisma.transaction.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        voter: true,
        items: { include: { participant: true } },
      },
    });

    return NextResponse.json({ pending });
  } catch (error) {
    console.error("[GET /api/admin/pending-payments]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
