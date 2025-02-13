const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todas as métricas
exports.listMetricas = async (req, res) => {
    try {
        const metricas = await prisma.metric.findMany({
            orderBy: { date: 'desc' }
        });
        return res.status(200).json(metricas);
    } catch (error) {
        console.error('Erro ao listar métricas:', error);
        return res.status(500).json({ error: 'Erro ao listar métricas.' });
    }
};

// Criar uma nova métrica
exports.createMetrica = async (req, res) => {
    const { type, name, value, date } = req.body;
    try {
        const metrica = await prisma.metric.create({
            data: { type, name, value, date: date ? new Date(date) : new Date() }
        });
        return res.status(201).json(metrica);
    } catch (error) {
        console.error('Erro ao criar métrica:', error);
        return res.status(500).json({ error: 'Erro ao criar métrica.' });
    }
};

// Deletar uma métrica por ID
exports.deleteMetrica = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.metric.delete({ where: { id: parseInt(id) } });
        return res.status(200).json({ message: 'Métrica removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar métrica:', error);
        return res.status(500).json({ error: 'Erro ao deletar métrica.' });
    }
};
