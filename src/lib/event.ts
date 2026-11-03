// src/lib/event.ts
// Règle unique utilisée par tout le site (public et admin) :
// l'édition en cours est l'événement créé le plus récemment.
// Les événements plus anciens sont des archives : conservés, consultables, mais plus votables.

import { prisma } from "@/lib/prisma";

export function getCurrentEvent() {
  return prisma.votingEvent.findFirst({ orderBy: { createdAt: "desc" } });
}

/** Année affichée pour une édition (ex : "Édition 2027"). */
export function getEditionYear(event: { endDate: Date }): number {
  return event.endDate.getFullYear();
}

export type EventInput = {
  title: string;
  startDate: Date;
  endDate: Date;
  votePrice: number;
};

/**
 * Valide les champs d'une édition reçus d'un formulaire.
 * @returns les valeurs nettoyées, ou un message d'erreur à afficher.
 */
export function parseEventInput(body: Record<string, unknown>): EventInput | string {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < 3 || title.length > 120) {
    return "Le titre doit contenir entre 3 et 120 caractères.";
  }

  const startDate = new Date(String(body.startDate ?? ""));
  const endDate = new Date(String(body.endDate ?? ""));
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return "Les dates de début et de fin sont obligatoires.";
  }
  if (endDate <= startDate) {
    return "La date de fin doit être après la date de début.";
  }

  const votePrice = body.votePrice;
  if (typeof votePrice !== "number" || !Number.isInteger(votePrice) || votePrice < 1) {
    return "Le prix du vote doit être un nombre entier positif.";
  }

  return { title, startDate, endDate, votePrice };
}

/**
 * Une édition entre dans l'historique public dès qu'elle est terminée :
 * archivée (une édition plus récente existe) ou date de fin dépassée.
 */
export function isEditionFinished(event: { id: string; endDate: Date }, currentEventId: string | undefined): boolean {
  return event.id !== currentEventId || event.endDate.getTime() < Date.now();
}

/** Éditions terminées, de la plus récente à la plus ancienne. */
export async function getPastEvents() {
  const [current, events] = await Promise.all([
    getCurrentEvent(),
    prisma.votingEvent.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return events.filter((event) => isEditionFinished(event, current?.id));
}
