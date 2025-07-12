import prisma from '../../prisma/client.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { wasabiS3, bucketName } from '../../config/wasabi.js';


export async function addCarrouselImages(req, res) {
  try {
    const userId = req.user?.id;
    const carrouselImages = req.files;

    if (!carrouselImages || carrouselImages.length === 0) {
      return res.status(400).json({ error: "Nenhuma imagem enviada" });
    }

    const companion = await prisma.companion.findUnique({
      where: { userId },
    });

    if (!companion) {
      return res.status(404).json({ error: "Acompanhante não encontrado" });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: companion.planId },
    });

    let maxImages = 1;

    if (plan) {
      const planName = plan.name;

      if (planName.includes("Plano Rubi")) {
        maxImages = 5;
      } else if (planName.includes("Plano Safira")) {
        maxImages = 4;
      } else if (
        planName.includes("Plano Vip") ||
        planName.includes("Plano Pink")
      ) {
        maxImages = 1;
      } else if (
        planName.includes("Contato") ||
        planName.includes("Oculto") ||
        planName.includes("Reviews Públicos") ||
        planName.includes("Darkmode") ||
        planName.includes("Plano Nitro")
      ) {
        maxImages = 0;
      }
    }

    const currentImages = await prisma.carrouselImage.findMany({
      where: { companionId: companion.id },
      orderBy: { order: "asc" },
    });

    const currentImagesCount = currentImages.length;

    // Verificação se o limite foi atingido
    if (currentImagesCount >= maxImages && maxImages !== 1) {
      return res.status(200).json({
        message: `Você já atingiu o limite de ${maxImages} imagem${maxImages > 1 ? 's' : ''} permitido${maxImages > 1 ? 's' : ''} para o seu plano.`,
        limitReached: true
      });
    }

    const newImages = [];

    if (maxImages === 1) {
      const newImage = carrouselImages[0];
      const newImageUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${newImage.key}`;

      if (
        currentImages.length === 0 ||
        currentImages[0].imageUrl !== newImageUrl
      ) {
        if (currentImages.length > 0) {
          // Atualizar imagem existente
          const updatedImage = await prisma.carrouselImage.update({
            where: { id: currentImages[0].id },
            data: {
              imageUrl: newImageUrl,
            },
          });
          newImages.push(updatedImage);
        } else {
          // Criar nova imagem
          const createdImage = await prisma.carrouselImage.create({
            data: {
              companionId: companion.id,
              imageUrl: newImageUrl,
              order: 1,
            },
          });
          newImages.push(createdImage);
        }
      } else {
        return res.status(200).json({
          message: "A imagem enviada já está no carrossel.",
          images: currentImages,
        });
      }
    }

    // 👉 Caso o plano permita **mais de uma imagem**
    else {
      for (const image of carrouselImages) {
        const newImageUrl = `https://${process.env.WASABI_BUCKET}.s3.${process.env.WASABI_REGION}.wasabisys.com/${image.key}`;

        // Verifica se já existe uma imagem igual no banco
        const alreadyExists = currentImages.some(img => img.imageUrl === newImageUrl);

        if (!alreadyExists && currentImagesCount + newImages.length < maxImages) {
          const createdImage = await prisma.carrouselImage.create({
            data: {
              companionId: companion.id,
              imageUrl: newImageUrl,
              order: currentImagesCount + newImages.length + 1,
            },
          });
          newImages.push(createdImage);
        }
      }
    }

    return res.status(200).json({
      message: newImages.length > 0
        ? "Imagens atualizadas com sucesso."
        : "Nenhuma nova imagem foi adicionada.",
      images: newImages,
    });

  } catch (error) {
    console.error("Erro ao adicionar/atualizar imagens do carrossel:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export async function deleteCarrouselImage(req, res) {
  try {
    const userId = req.user?.id;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "URL da imagem não fornecida." });
    }

    const companion = await prisma.companion.findUnique({
      where: { userId },
    });

    if (!companion) {
      return res.status(404).json({ error: "Acompanhante não encontrado." });
    }

    const imageToDelete = await prisma.carrouselImage.findFirst({
      where: {
        companionId: companion.id,
        imageUrl,
      },
    });

    if (!imageToDelete) {
      return res.status(404).json({ error: "Imagem não encontrada ou já removida." });
    }

    // Extrair a chave do arquivo do link da imagem
    const key = imageUrl.split(`${bucketName}.s3.`)[1].split(".wasabisys.com/")[1];

    if (!key) {
      return res.status(400).json({ error: "Chave da imagem inválida para exclusão." });
    }

    // Comando para deletar da Wasabi
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await wasabiS3.send(deleteCommand);

    // Remover do banco de dados
    await prisma.carrouselImage.delete({
      where: { id: imageToDelete.id },
    });

    // Reordenar imagens restantes
    const remainingImages = await prisma.carrouselImage.findMany({
      where: { companionId: companion.id },
      orderBy: { order: "asc" },
    });

    for (let i = 0; i < remainingImages.length; i++) {
      await prisma.carrouselImage.update({
        where: { id: remainingImages[i].id },
        data: { order: i + 1 },
      });
    }

    return res.status(200).json({ message: "Imagem removida com sucesso." });

  } catch (error) {
    console.error("Erro ao remover imagem do carrossel:", error);
    return res.status(500).json({ error: "Erro interno ao remover imagem." });
  }
};
