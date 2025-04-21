const prisma = require('../prisma/client'); // ajuste o caminho se necessário

exports.registerConsent = async (req, res) => {
  try {
    const { page, accepted, browser_fingerprint } = req.body;

    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const user_agent = req.headers['user-agent'];

    if (typeof accepted === 'undefined' || !browser_fingerprint) {
      return res.status(400).json({ error: 'Dados obrigatórios ausentes.' });
    }

    const consent = await prisma.consent.create({
      data: {
        page,
        accepted,
        ip_address,
        user_agent,
        browser_fingerprint,
        user_id: null, // ainda não logado
      },
    });

    res.status(201).json({ message: 'Consentimento registrado com sucesso.', data: consent });
  } catch (error) {
    console.error('Erro ao registrar consentimento:', error);
    res.status(500).json({ error: 'Erro interno ao registrar consentimento.' });
  }
};
