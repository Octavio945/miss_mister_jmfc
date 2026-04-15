// src/lib/telegram.ts

/**
 * Envoie une notification à un canal ou utilisateur Telegram via un Bot.
 * Nécessite les variables d'environnement TELEGRAM_BOT_TOKEN et TELEGRAM_CHAT_ID.
 */
export async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("⚠️ Telegram non configuré : TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant.");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML", // Permet d'utiliser du HTML simple pour le formatage
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erreur Telegram API:", data);
    } else {
      console.log("✅ Notification Telegram envoyée avec succès.");
    }
  } catch (error) {
    console.error("💥 Erreur lors de l'envoi de la notification Telegram:", error);
  }
}
