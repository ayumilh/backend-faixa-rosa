import prisma from '../../prisma/client.js';


// Listar todos os pagamentos
export async function listPagamentos(req, res) {
    try {
        const pagamentos = await prisma.payment.findMany({
            include: {
                appUser: {
                    select: { firstName: true, lastName: true }
                },
                plan: {
                    select: { name: true, price: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json(pagamentos);
    } catch (error) {
        console.error('Erro ao listar pagamentos:', error);
        return res.status(500).json({ error: 'Erro ao listar pagamentos.' });
    }
};

// Obter detalhes de um pagamento por ID
export async function getPagamentoById(req, res) {
    const { id } = req.params;
    try {
        const pagamento = await prisma.payment.findUnique({
            where: { id: parseInt(id) },
            include: {
                appUser: {
                    select: { firstName: true, lastName: true }
                },
                plan: {
                    select: { name: true, price: true }
                }
            }
        });

        if (!pagamento) return res.status(404).json({ error: 'Pagamento não encontrado.' });

        return res.status(200).json(pagamento);
    } catch (error) {
        console.error('Erro ao buscar pagamento:', error);
        return res.status(500).json({ error: 'Erro ao buscar pagamento.' });
    }
};
