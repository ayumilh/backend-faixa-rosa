import cron from 'node-cron';
import expireSubscriptions from './expireSubscriptions.js';
import updateTop10Ranking from './updateTop10Ranking.js';
import expireNitroPlans from './expireNitroPlans.js';

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

// Rodar a cada 5 minutos para expirar Nitro
cron.schedule('*/5 * * * *', () => {
  console.log('⚡ Verificando Plano Nitro expirado...');
  expireNitroPlans();
});
