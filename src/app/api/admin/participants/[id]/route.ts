import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, number, description, imageUrl, isActive } = body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (category !== undefined) dataToUpdate.category = category;
    if (number !== undefined) dataToUpdate.number = number;
    if (description !== undefined) dataToUpdate.description = description;
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;

    const updatedParticipant = await prisma.participant.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, participant: updatedParticipant });
  } catch (error) {
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
  try {
    const { id } = await params;
    await prisma.participant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/participants/[id]]", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression." },
      { status: 500 }
    );
  }
}
