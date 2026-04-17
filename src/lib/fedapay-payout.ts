// src/lib/fedapay-payout.ts
// Envoie automatiquement l'argent d'un paiement réussi vers un numéro mobile money

interface PayoutResult {
  success: boolean;
  payoutId?: string;
  error?: string;
  rawError?: any;
}

/**
 * Normalise un numéro de téléphone béninois pour FedaPay.
 * FedaPay attend le numéro local sans le 0 initial (ex: 97000000)
 * OU avec le préfixe +229 selon la version API.
 * On envoie le numéro brut et laisse FedaPay + country="BJ" gérer.
 */
function normalizePhone(phone: string): string {
  // Supprimer espaces, tirets, parenthèses
  let cleaned = phone.replace(/[\s\-().]/g, "");
  // Supprimer le +229 ou 229 en début si présent (FedaPay + country le rajoute)
  if (cleaned.startsWith("+229")) cleaned = cleaned.slice(4);
  else if (cleaned.startsWith("229") && cleaned.length > 10) cleaned = cleaned.slice(3);
  return cleaned;
}

/**
 * Extrait le message d'erreur depuis la réponse FedaPay (formats variés).
 */
function extractFedaError(data: any): string {
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.error) return typeof data.error === "string" ? data.error : JSON.stringify(data.error);
  if (data?.errors) return JSON.stringify(data.errors);
  return JSON.stringify(data);
}

/**
 * Crée un payout FedaPay et le déclenche immédiatement.
 * Appelé après chaque transaction marquée SUCCESS dans le webhook.
 *
 * @param amount       Montant en XOF (entier)
 * @param reference    Référence interne de la transaction
 */
export async function sendFedaPayPayout(
  amount: number,
  reference: string
): Promise<PayoutResult> {
  const secretKey     = process.env.FEDAPAY_SECRET_KEY;
  const rawPhone      = process.env.PAYOUT_PHONE_NUMBER;
  const country       = process.env.PAYOUT_COUNTRY ?? "BJ";
  const recipientName = process.env.PAYOUT_RECIPIENT_NAME ?? "Organisateur";
  // Mode opérateur : mtn | moov | moov_tg | orange_ci … (défaut mtn pour Bénin)
  const mode          = process.env.PAYOUT_MODE ?? "mtn";

  // ── Vérifications de configuration ───────────────────────────────────────
  if (!secretKey) {
    console.error("❌ Payout: FEDAPAY_SECRET_KEY manquant");
    return { success: false, error: "Clé FedaPay manquante" };
  }
  if (!rawPhone) {
    console.error("❌ Payout: PAYOUT_PHONE_NUMBER non configuré — payout ignoré");
    return { success: false, error: "Numéro bénéficiaire non configuré" };
  }

  const phoneNumber = normalizePhone(rawPhone);
  const isSandbox   = secretKey.includes("sandbox");
  const apiUrl      = isSandbox
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";

  const headers = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };

  console.log(`💸 Payout FedaPay [${isSandbox ? "SANDBOX" : "LIVE"}] : ${amount} XOF → ${phoneNumber} (${country}/${mode}) | ref: ${reference}`);

  try {
    // ── Étape 1 : Créer le payout ─────────────────────────────────────────
    const payoutBody = {
      amount: Math.round(amount),
      currency: { iso: "XOF" },
      description: `Reversement votes - ${reference}`,
      mode,
      customer: {
        firstname: recipientName.split(" ")[0] ?? recipientName,
        lastname:  recipientName.split(" ").slice(1).join(" ") ?? "",
        email: `payout_${Date.now()}@temp.com`,
        phone_number: {
          number:  phoneNumber,
          country: country,
        },
      },
    };

    console.log("📤 Corps payout:", JSON.stringify(payoutBody));

    const createRes  = await fetch(`${apiUrl}/payouts`, {
      method: "POST",
      headers,
      body: JSON.stringify(payoutBody),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      const errMsg = extractFedaError(createData);
      console.error(`❌ Payout création échouée (HTTP ${createRes.status}):`, errMsg);
      console.error("📋 Réponse complète:", JSON.stringify(createData));
      return { success: false, error: errMsg, rawError: createData };
    }

    // L'ID du payout est imbriqué sous "v1/payout" selon la convention FedaPay
    const payoutObj = createData["v1/payout"] ?? createData;
    const payoutId  = String(payoutObj?.id ?? "");

    if (!payoutId) {
      console.error("❌ Payout: ID introuvable dans la réponse:", createData);
      return { success: false, error: "ID payout manquant", rawError: createData };
    }

    console.log(`✅ Payout créé avec ID: ${payoutId} — statut: ${payoutObj?.status}`);

    // ── Étape 2 : Déclencher l'envoi immédiat ─────────────────────────────
    console.log(`🚀 Envoi immédiat du payout ${payoutId}...`);

    const sendRes  = await fetch(`${apiUrl}/payouts/${payoutId}/send_now`, {
      method: "PUT",
      headers,
    });

    const sendData = await sendRes.json();

    if (!sendRes.ok) {
      const errMsg = extractFedaError(sendData);
      console.error(`❌ Payout send_now échoué (HTTP ${sendRes.status}):`, errMsg);
      console.error("📋 Réponse complète send_now:", JSON.stringify(sendData));
      return { success: false, payoutId, error: errMsg, rawError: sendData };
    }

    const sentPayout = sendData["v1/payout"] ?? sendData;
    console.log(`✅ Payout ${payoutId} envoyé — statut: ${sentPayout?.status ?? "?"} → ${phoneNumber}`);
    return { success: true, payoutId };

  } catch (err: any) {
    console.error("💥 Exception payout FedaPay:", err);
    return { success: false, error: err.message ?? "Erreur inconnue" };
  }
}
