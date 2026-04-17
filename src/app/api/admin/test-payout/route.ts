// src/app/api/admin/test-payout/route.ts
// Route de diagnostic — teste un payout FedaPay avec 1 XOF et retourne la réponse complète

import { NextResponse } from "next/server";
import { requireAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { sendFedaPayPayout } from "@/lib/fedapay-payout";

export async function GET() {
  if (!(await requireAdminAuth())) return unauthorizedResponse();

  // Lire la config pour afficher l'état
  const config = {
    FEDAPAY_SECRET_KEY:    process.env.FEDAPAY_SECRET_KEY
      ? `${process.env.FEDAPAY_SECRET_KEY.substring(0, 12)}...` : "❌ MANQUANT",
    PAYOUT_PHONE_NUMBER:   process.env.PAYOUT_PHONE_NUMBER   ?? "❌ MANQUANT",
    PAYOUT_COUNTRY:        process.env.PAYOUT_COUNTRY         ?? "BJ (défaut)",
    PAYOUT_MODE:           process.env.PAYOUT_MODE            ?? "mtn (défaut)",
    PAYOUT_RECIPIENT_NAME: process.env.PAYOUT_RECIPIENT_NAME  ?? "❌ MANQUANT",
    environment:           process.env.FEDAPAY_SECRET_KEY?.includes("sandbox") ? "SANDBOX" : "LIVE",
  };

  // Déclencher un payout test de 100 XOF (montant minimal)
  const result = await sendFedaPayPayout(100, "TEST-PAYOUT-DIAG");

  return NextResponse.json({
    config,
    result,
    timestamp: new Date().toISOString(),
  });
}
