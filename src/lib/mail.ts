import nodemailer from 'nodemailer';

export async function sendAdminNotification(
  participantName: string,
  voteCount: number,
  amount: number,
  reference: string
) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // par défaut on utilise gmail, vous pouvez ajuster
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Plateforme de Vote" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `🚨 Nouveau Paiement Validé : ${voteCount} vote(s) pour ${participantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #2e6c80;">Confirmation de Vote 🎉</h2>
          <p>Un utilisateur vient de finaliser avec succès un paiement de vote.</p>
          <ul style="font-size: 16px;">
            <li><strong>Candidat :</strong> ${participantName}</li>
            <li><strong>Nombre de votes :</strong> ${voteCount}</li>
            <li><strong>Montant payé :</strong> ${amount.toLocaleString()} FCFA</li>
            <li><strong>Référence Transaction :</strong> ${reference}</li>
          </ul>
          <p style="color: #555;">NB: Les fonds ont été crédités sur votre compte FedaPay. Vous pouvez initier un retrait vers le 0159131586 depuis le tableau de bord FedaPay.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email] Notification envoyée à l'administrateur pour la ref: ${reference}`);
  } catch (error) {
    console.error("[Email Error] Erreur lors de l'envoi de la notification:", error);
  }
}
