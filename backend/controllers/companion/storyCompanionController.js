import prisma from '../../prisma/client.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { uploadStorySingle, wasabiS3, bucketName } from '../../config/wasabi.js';

// Criar um story (imagem ou vídeo)
export async function createStory(req, res) {
  try {
    const userId = req.user?.id;
    const companion = await prisma.companion.findFirst({ where: { userId } });
    if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrado.' });


    uploadStorySingle(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });

      if (!req.file) return res.status(400).json({ error: "Arquivo de mídia obrigatório." });

      // Montar a URL correta no Wasabi manualmente
      const wasabiUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${req.file.key}`;

      const mediaType = req.file.mimetype.startsWith("image/") ? "image" : "video";

      // Criar o Story com expiração em 24h
      const story = await prisma.story.create({
        data: {
          companionId: companion.id,
          url: wasabiUrl, // Armazena a URL correta
          mediaType,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expira em 24 horas
        },
      });

      return res.status(201).json({ message: "Story publicado com sucesso.", story });
    });
  } catch (error) {
    console.error('Erro ao publicar story:', error);
    return res.status(500).json({ error: 'Erro ao publicar story.' });
  }
};

// Listar stories ativos da acompanhante autenticada
export async function listActiveStories(req, res) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  try {
    // Busca o ID da acompanhante vinculada ao userId autenticado
    const companion = await prisma.companion.findUnique({
      where: { userId },
    });

    if (!companion) {
      return res.status(404).json({ error: 'Acompanhante não encontrada.' });
    }

    const stories = await prisma.story.findMany({
      where: {
        companionId: companion.id,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(stories);
  } catch (error) {
    console.error('Erro ao listar stories:', error);
    return res.status(500).json({ error: 'Erro ao listar stories.' });
  }
};


// Deletar um story específico (caso a acompanhante queira remover antes de expirar)
export async function deleteStory(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const companion = await prisma.companion.findFirst({ where: { userId } });
    if (!companion) return res.status(404).json({ error: 'Acompanhante não encontrado.' });

    const story = await prisma.story.findUnique({
      where: { id: parseInt(id) },
      select: { url: true }
    });

    if (!story) return res.status(404).json({ error: "Story não encontrado." });

    // Extrair o nome do arquivo da URL armazenada no banco
    const fileName = story.url.split(".com/")[1]; // Obtém apenas o caminho do arquivo

    // Criar o comando para deletar no Wasabi
    const deleteParams = {
      Bucket: bucketName,
      Key: fileName,
    };

    await wasabiS3.send(new DeleteObjectCommand(deleteParams));

    await prisma.story.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({ message: 'Story excluído com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir story.' });
  }
};

// Remover stories expirados automaticamente (agendado para rodar de tempos em tempos)
export async function cleanExpiredStories() {
  try {
    await prisma.story.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });
  } catch (error) {
    console.error('Erro ao limpar stories expirados:', error);
  }
};
