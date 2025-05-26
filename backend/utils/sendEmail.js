const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,            
  port: parseInt(process.env.EMAIL_PORT),  
  secure: false,                           
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, subject, html) {
  const mailOptions = {
    from: `"Faixa Rosa" <${process.env.EMAIL_USER}>`,
    to: "contato@faixarosa.com",
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
