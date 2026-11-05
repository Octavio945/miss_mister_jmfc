import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

// Prisma P2002 : violation de la contrainte unique (eventId, category, number)
function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, number, description, imageUrl } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (category !== undefined) dataToUpdate.category = category;
    if (number !== undefined) dataToUpdate.number = number;
    if (description !== undefined) dataToUpdate.description = description;
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl;

    const updatedParticipant = await prisma.participant.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, participant: updatedParticipant });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "Ce numéro est déjà attribué à un autre candidat de cette catégorie." },
        { status: 409 }
      );
    }
    console.error("[PUT /api/admin/participants/[id]]", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la modification." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (db) => {
      // Des votes payés sont rattachés au candidat : on refuse pour ne pas perdre l'argent encaissé
      const paid = await db.transactionItem.count({
        where: { participantId: id, transaction: { status: "SUCCESS" } },
      });
      if (paid > 0) return { paid };

      // Paiements jamais finalisés ou échoués : aucun argent reçu, on les supprime avec le candidat
      await db.transaction.deleteMany({
        where: { status: { not: "SUCCESS" }, items: { some: { participantId: id } } },
      });
      await db.participant.delete({ where: { id } });
      return { paid: 0 };
    });

    if (result.paid > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer ce candidat : ${result.paid} paiement${result.paid > 1 ? "s" : ""} confirmé${result.paid > 1 ? "s" : ""} lui ${result.paid > 1 ? "sont" : "est"} rattaché${result.paid > 1 ? "s" : ""}. Ces paiements doivent rester dans l'historique.`,
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Ce candidat n'existe plus." }, { status: 404 });
    }
    console.error("[DELETE /api/admin/participants/[id]]", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression." },
      { status: 500 }
    );
  }
}
