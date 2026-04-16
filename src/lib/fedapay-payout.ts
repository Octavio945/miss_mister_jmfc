// src/lib/fedapay-payout.ts
// Envoie automatiquement l'argent d'un paiement réussi vers un numéro mobile money

interface PayoutResult {
  success: boolean;
  payoutId?: string;
  error?: string;
}

/**
 * Crée un payout FedaPay et le déclenche immédiatement.
 * Appelé après chaque transaction marquée SUCCESS dans le webhook.
 *
 * @param amount       Montant en XOF (entier)
 * @param reference    Référence interne de la transaction (pour la description)
 */
export async function sendFedaPayPayout(
  amount: number,
  reference: string
): Promise<PayoutResult> {
  const secretKey = process.env.FEDAPAY_SECRET_KEY;
  const phoneNumber = process.env.PAYOUT_PHONE_NUMBER;
  const country = process.env.PAYOUT_COUNTRY ?? "BJ";
  const recipientName = process.env.PAYOUT_RECIPIENT_NAME ?? "Organisateur";

  // Vérifications de configuration
  if (!secretKey) {
    console.error("❌ Payout: FEDAPAY_SECRET_KEY manquant");
    return { success: false, error: "Clé FedaPay manquante" };
  }

  if (!phoneNumber) {
    console.error("❌ Payout: PAYOUT_PHONE_NUMBER non configuré — payout ignoré");
    return { success: false, error: "Numéro bénéficiaire non configuré" };
  }

  const isSandbox = secretKey.includes("sandbox");
  const apiUrl = isSandbox
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";

  const headers = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };

  try {
    // ── Étape 1 : Créer le payout ─────────────────────────────────────────
    console.log(`💸 Création du payout FedaPay : ${amount} XOF → ${phoneNumber} (${country})`);

    const createRes = await fetch(`${apiUrl}/payouts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        amount: Math.round(amount),
        currency: { iso: "XOF" },
        description: `Reversement votes - ${reference}`,
        customer: {
          firstname: recipientName,
          lastname: "",
          email: `payout_${reference.toLowerCase()}@temp.com`,
          phone_number: {
            number: phoneNumber,
            country: country,
          },
        },
      }),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      console.error("❌ Payout création échouée:", createData);
      return {
        success: false,
        error: createData?.message ?? "Erreur création payout",
      };
    }

    // L'ID du payout est imbriqué sous "v1/payout" selon la convention FedaPay
    const payoutObj = createData["v1/payout"] ?? createData;
    const payoutId = String(payoutObj?.id ?? "");

    if (!payoutId) {
      console.error("❌ Payout: ID introuvable dans la réponse:", createData);
      return { success: false, error: "ID payout manquant" };
    }

    console.log(`✅ Payout créé avec ID: ${payoutId}`);

    // ── Étape 2 : Déclencher l'envoi immédiat ─────────────────────────────
    console.log(`🚀 Envoi immédiat du payout ${payoutId}...`);

    const sendRes = await fetch(`${apiUrl}/payouts/${payoutId}/send_now`, {
      method: "PUT",
      headers,
    });

    const sendData = await sendRes.json();

    if (!sendRes.ok) {
      console.error("❌ Payout send_now échoué:", sendData);
      return {
        success: false,
        payoutId,
        error: sendData?.message ?? "Erreur déclenchement payout",
      };
    }

    console.log(`✅ Payout ${payoutId} envoyé avec succès vers ${phoneNumber}`);
    return { success: true, payoutId };

  } catch (err: any) {
    console.error("💥 Exception payout FedaPay:", err);
    return { success: false, error: err.message ?? "Erreur inconnue" };
  }
}
