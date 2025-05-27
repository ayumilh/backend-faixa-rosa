const sendEmail = require('./utils/sendEmail');

sendEmail(
  'seuemaildestino@gmail.com',
  'Teste de envio SMTP GoDaddy',
  '<h1>Funcionou!</h1><p>Este e-mail foi enviado com Microsoft 365 (via Hostinger).</p>'
);
