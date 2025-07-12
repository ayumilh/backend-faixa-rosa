import prisma from '../prisma/client.js';

export async function registerConsent(req, res) {
  try {
    const { accepted, browser_fingerprint } = req.body;

    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const user_agent = req.headers['user-agent'];

    if (typeof accepted === 'undefined' || !browser_fingerprint) {
      return res.status(400).json({ error: 'Dados obrigatórios ausentes.' });
    }

    const consent = await prisma.consent.create({
      data: {
        accepted,
        ip_address,
        user_agent,
        browser_fingerprint,
      },
    });

    res.status(201).json({ message: 'Consentimento registrado com sucesso.', data: consent });
  } catch (error) {
    console.error('Erro ao registrar consentimento:', error);
    res.status(500).json({ error: 'Erro interno ao registrar consentimento.' });
  }
}
