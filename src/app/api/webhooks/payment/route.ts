import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { sendAdminNotification } from "@/lib/mail";

const FEDAPAY_SECRET = process.env.FEDAPAY_SECRET_KEY ?? "";

/**
 * POST /api/webhooks/payment
 * Endpoint appelé par FedaPay quand un paiement est confirmé.
 * Vérifie la signature HMAC, puis crédite les votes au participant.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-fedapay-signature") ?? "";

    if (FEDAPAY_SECRET) {
      let expected = "";
      let actualSignature = signature;
      
      // Support de la nouvelle signature FedaPay V2 (t=timestamp,s=signature)
      if (signature.includes("t=") && signature.includes("s=")) {
        const timestampMatch = signature.match(/t=([^,]+)/);
        const signatureMatch = signature.match(/s=([^,]+)/);
        
        if (timestampMatch && signatureMatch) {
          const timestamp = timestampMatch[1];
          actualSignature = signatureMatch[1];
          const payloadToSign = `${timestamp}.${rawBody}`;
          
          expected = createHmac("sha256", FEDAPAY_SECRET)
            .update(payloadToSign)
            .digest("hex");
        }
      } else {
        // Fallback ancienne version
        expected = createHmac("sha256", FEDAPAY_SECRET)
          .update(rawBody)
          .digest("hex");
      }

      if (actualSignature !== expected) {
        console.warn(`[Webhook] Signature invalide.\nAttendu: ${expected}\nReçu: ${actualSignature}`);
      }
    }

    const payload = JSON.parse(rawBody);

    // FedaPay envoie "name" pour le type d'événement (ex: "transaction.approved")
    const eventType: string = payload.name ?? payload.event ?? payload.type ?? "";
    
    console.log(`\n➡️ [Webhook] Événement FedaPay reçu : ${eventType}`);

    // Tenter de récupérer notre référence interne
    let externalRef: string = "";
    
    // 1. Depuis custom_metadata si défini
    if (payload?.entity?.custom_metadata?.reference) {
      externalRef = payload.entity.custom_metadata.reference;
    } 
    // 2. Ou bien depuis la description (backup) car on avait mis "Réf: ..."
    else if (payload?.entity?.description) {
      const match = payload.entity.description.match(/Réf:\s*([A-Za-z0-9-_]+)/);
      if (match) externalRef = match[1];
    }
    // 3. Fallback sur les structures communes
    if (!externalRef) {
      externalRef = payload?.entity?.reference ?? payload?.data?.reference ?? payload?.reference ?? "";
    }
    
    console.log(`➡️ [Webhook] Référence extraite : ${externalRef}`);

    if (!eventType.includes("approved") && !eventType.includes("success")) {
      console.log(`⚠️ [Webhook] Ignoré car l'événement n'est pas "approved" (actuel: ${eventType}).`);
      return NextResponse.json({ received: true });
    }

    if (!externalRef) {
      console.error(`❌ [Webhook] Référence interne manquante.`);
      return NextResponse.json({ error: "Référence interne manquante." }, { status: 400 });
    }

    // ── Retrouver la transaction ─────────────────────────────────────────────
    const transaction = await prisma.transaction.findUnique({
      where: { reference: externalRef },
      include: { items: { include: { participant: true } } },
    });

    if (!transaction) {
      console.error(`[Webhook] Transaction introuvable pour ref=${externalRef}`);
      return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });
    }

    if (transaction.status === "SUCCESS") {
      // Idempotence : déjà traité
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    // ── Mettre à jour la transaction et créditer les votes ───────────────────
    await prisma.$transaction(async (tx) => {
      // 1. Marquer la transaction SUCCESS
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: "SUCCESS", paidAt: new Date() },
      });

      // 2. Pour chaque item, ajouter les votes au participant
      for (const item of transaction.items) {
        await tx.participant.update({
          where: { id: item.participantId },
          data: { totalVotes: { increment: item.numberOfVotes } },
        });
      }
    });

    // 3. Envoyer la notification
    const firstItem = transaction.items[0];
    const participantName = firstItem?.participant?.name || "Inconnu";
    const totalVotes = transaction.items.reduce((sum, item) => sum + item.numberOfVotes, 0);

    await sendAdminNotification(
      participantName,
      totalVotes,
      transaction.amount,
      externalRef
    );

    console.log(`✅ [Webhook] Transaction ${externalRef} confirmée.`);
    return NextResponse.json({ received: true, success: true });
  } catch (error) {
    console.error("[POST /api/webhooks/payment]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
