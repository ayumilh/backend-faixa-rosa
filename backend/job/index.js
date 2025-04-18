const cron = require('node-cron');
const expireSubscriptions = require('./expireSubscriptions');
const updateTop10Ranking = require('./updateTop10Ranking');

console.log("📆 CRON ativado...");


// Rodar todos os dias à meia-noite
cron.schedule('0 0 * * *', () => {
  console.log('🕛 Verificando assinaturas expiradas...');
  expireSubscriptions();
});


// Rodar todo dia às 2h da manhã
cron.schedule('0 2 * * *', () => {
  console.log('📊 Atualizando ranking Top 10...');
  updateTop10Ranking();
});