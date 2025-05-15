const expireNitroPlans = require('./job/expireNitroPlans');

(async () => {
  console.log("🔁 Iniciando teste do expirar Plano Nitro...");
  await expireNitroPlans();
  console.log("✅ Teste concluído.");
})();
