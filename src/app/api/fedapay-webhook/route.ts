// src/app/api/fedapay-webhook/route.ts
// Notification de FedaPay (URL à déclarer dans le tableau de bord FedaPay → Webhooks).
//
// Le contenu reçu n'est PAS cru : n'importe qui peut appeler cette adresse. On n'en lit que
// l'identifiant de transaction, puis on demande le vrai statut à FedaPay avec la clé secrète
// (syncTransactionWithFedapay). Un faux « paiement réussi » ne peut donc ajouter aucun vote.

import { NextResponse } from "next/server";
import { FedapayError, syncTransactionWithFedapay } from "@/lib/fedapay";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  // FedaPay envoie { name: "transaction.approved", entity: { id, ... } }
  const payload = body as { entity?: { id?: unknown }; transaction?: { id?: unknown } } | null;
  const rawId = payload?.entity?.id ?? payload?.transaction?.id;
  const fedapayId = rawId === undefined || rawId === null ? "" : String(rawId);
  if (!/^\d+$/.test(fedapayId)) {
    return NextResponse.json({ error: "Identifiant de transaction manquant." }, { status: 400 });
  }

  try {
    const result = await syncTransactionWithFedapay({ fedapayId });
    // NOT_FOUND : transaction d'un autre site ou d'un autre environnement, rien à faire
    return NextResponse.json({ received: true, result });
  } catch (error) {
    console.error("[POST /api/fedapay-webhook]", error instanceof FedapayError ? error.details ?? error.message : error);
    // 503 : FedaPay renverra la notification plus tard
    return NextResponse.json({ error: "Vérification impossible pour le moment." }, { status: 503 });
  }
}
