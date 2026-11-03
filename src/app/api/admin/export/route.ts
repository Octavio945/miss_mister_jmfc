import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

type Cell = string | number | null | undefined;

// Séparateur ";" + BOM UTF-8 : s'ouvre directement dans Excel en français.
function toCsv(rows: Cell[][]): string {
  const escape = (value: Cell) => {
    let text = value === null || value === undefined ? "" : String(value);
    // Un texte saisi par un votant ne doit jamais être interprété comme une formule
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return "﻿" + rows.map((row) => row.map(escape).join(";")).join("\r\n");
}

const formatDate = (date: Date | null) =>
  date ? date.toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" }) : "";

// GET /api/admin/export?event=<id>&type=results|transactions
export async function GET(request: Request) {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("event") ?? "";
    const type = searchParams.get("type");

    if (type !== "results" && type !== "transactions") {
      return NextResponse.json({ error: "Type d'export invalide." }, { status: 400 });
    }

    const event = await prisma.votingEvent.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Édition introuvable." }, { status: 404 });
    }

    let rows: Cell[][];

    if (type === "results") {
      const participants = await prisma.participant.findMany({
        where: { eventId },
        orderBy: [{ category: "asc" }, { totalVotes: "desc" }],
      });
      const rankByCategory = new Map<string, number>();
      rows = [
        ["Catégorie", "Rang", "Numéro", "Nom", "Votes"],
        ...participants.map((p) => {
          const rank = (rankByCategory.get(p.category) ?? 0) + 1;
          rankByCategory.set(p.category, rank);
          return [p.category, rank, p.number, p.name.trim(), p.totalVotes];
        }),
      ];
    } else {
      const transactions = await prisma.transaction.findMany({
        where: { eventId },
        orderBy: { createdAt: "asc" },
        include: { voter: true, items: { include: { participant: true } } },
      });
      rows = [
        ["Référence", "Statut", "Montant (FCFA)", "Votes", "Candidat", "Réseau", "Moyen de paiement", "Votant", "Téléphone", "Email", "Créée le", "Payée le"],
        ...transactions.map((t) => [
          t.reference,
          t.status,
          t.amount,
          t.items.reduce((sum, item) => sum + item.numberOfVotes, 0),
          t.items.map((item) => item.participant.name.trim()).join(", "),
          t.network,
          t.paymentMethod,
          t.voter?.isAnonymous ? `Anonyme (${t.voter.anonCode ?? ""})` : t.voter?.name,
          t.voter?.phone,
          t.voter?.email,
          formatDate(t.createdAt),
          formatDate(t.paidAt),
        ]),
      ];
    }

    const slug = event.title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // retire les accents (É → E)
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    const filename = `${type === "results" ? "resultats" : "transactions"}-${slug || "edition"}.csv`;

    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/export]", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'export." }, { status: 500 });
  }
}
