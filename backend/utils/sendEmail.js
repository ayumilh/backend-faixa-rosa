const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,             // smtp.office365.com
  port: parseInt(process.env.EMAIL_PORT),   // 587
  secure: false,                            // ❗ FALSO para 587 (TLS via STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3',                       // Opcional: ajuda a evitar alguns erros de TLS
    rejectUnauthorized: false              // Opcional: evita erro com certificados (em dev)
  }
});

async function sendEmail(to, subject, html) {
  const mailOptions = {
    from: `"Faixa Rosa" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ E-mail enviado:", info.messageId);
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    throw error;
  }
}

module.exports = sendEmail;
