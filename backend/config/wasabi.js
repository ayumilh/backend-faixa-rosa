import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';

dotenv.config();

// Configuração da conexão com a Wasabi
const wasabiS3 = new S3Client({
    region: process.env.WASABI_REGION,
    endpoint: process.env.WASABI_ENDPOINT,
    credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY,
        secretAccessKey: process.env.WASABI_SECRET_KEY,
    },
    forcePathStyle: true,
});

const bucketName = process.env.WASABI_BUCKET;

const upload = multer({
    storage: multerS3({
        s3: wasabiS3,
        bucket: bucketName,
        acl: "public-read", // Permite acesso público ao arquivo
        contentType: multerS3.AUTO_CONTENT_TYPE, // Define automaticamente o tipo do arquivo
        key: function (req, file, cb) {
            const folder = "companions/images/documents";
            const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
            cb(null, fileName);
        },
    }),
    limits: { fileSize: 100 * 1024 * 1024 }, // Limite de 100MB para vídeos
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas arquivos de imagem e vídeo são permitidos!"), false);
        }
    },
});

const uploadVideo = multer({
    storage: multerS3({
        s3: wasabiS3,
        bucket: bucketName,
        acl: "public-read",
        contentType: (req, file, cb) => {
            if (file.mimetype.startsWith("video/")) {
                cb(null, "video/mp4");
            } else {
                cb(new Error("Apenas vídeos são permitidos!"), false);
            }
        },
        key: function (req, file, cb) {
            const fileName = `companions/videos/${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
            cb(null, fileName);
        },
    }),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB máximo para vídeos
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("video/")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas vídeos são permitidos!"), false);
        }
    },
});

const uploadStory = multer({
    storage: multerS3({
        s3: wasabiS3,
        bucket: bucketName,
        acl: "public-read", // Permite acesso público ao arquivo
        contentType: multerS3.AUTO_CONTENT_TYPE, // Define automaticamente o tipo do arquivo
        key: function (req, file, cb) {
            // Define a pasta correta para imagens e vídeos dos Stories
            const folder = file.mimetype.startsWith("image/")
                ? "companions/stories/images"
                : "companions/stories/videos";
            const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
            cb(null, fileName);
        },
    }),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB máximo para vídeos
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas imagens e vídeos são permitidos!"), false);
        }
    },
});

const uploadFeed = multer({
    storage: multerS3({
        s3: wasabiS3,
        bucket: bucketName,
        acl: "public-read",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const folder = file.mimetype.startsWith("image/") ? "companions/feed/images" : "companions/feed/videos";
            const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
            cb(null, fileName);
        },
    }),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB máximo para vídeos
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas imagens e vídeos são permitidos!"), false);
        }
    },
});

const uploadProfileAndBanner = multer({
    storage: multerS3({
        s3: wasabiS3,
        bucket: bucketName,
        acl: "public-read", // Deixa os arquivos publicamente acessíveis
        contentType: multerS3.AUTO_CONTENT_TYPE, // Ajusta automaticamente o tipo do arquivo
        key: function (req, file, cb) {
            // Dependendo do campo, definimos a pasta no Wasabi
            let folder = "companions/profile";
            if (file.fieldname === "bannerImage") {
                folder = "companions/banner";
            }
            const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
            cb(null, fileName);
        },
    }),
    fileFilter: (req, file, cb) => {
        // Apenas imagens são permitidas (caso queira liberar vídeos, adapte aqui)
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas imagens são permitidas!"), false);
        }
    },
});

// Middleware para upload de imagens para o carrossel
const uploadCarrouselImage = multer({
    storage: multerS3({
        s3: wasabiS3,
        bucket: bucketName,
        acl: "public-read", // Permite acesso público ao arquivo
        contentType: multerS3.AUTO_CONTENT_TYPE, // Define automaticamente o tipo do arquivo
        key: function (req, file, cb) {
            const folder = "companions/carrousel/images"; // Pasta onde as imagens de carrossel serão armazenadas
            const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
            cb(null, fileName);
        },
    }),
    limits: { fileSize: 100 * 1024 * 1024 }, // Limite de 100MB para imagens
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas arquivos de imagem são permitidos!"), false);
        }
    },
});

const uploadRegister = multer({
    storage: multerS3({
        s3: wasabiS3,
        bucket: bucketName,
        acl: "public-read", // Permite acesso público ao arquivo
        contentType: multerS3.AUTO_CONTENT_TYPE, // Define automaticamente o tipo do arquivo
        key: function (req, file, cb) {
            let folder = ''; // Definir a pasta padrão

            // Definir a pasta com base no nome do campo (fieldname)
            if (file.fieldname === 'fileFront') {
                folder = 'companions/images/documents'; // Pasta para documento da frente
            } else if (file.fieldname === 'fileBack') {
                folder = 'companions/images/documents'; // Pasta para documento de trás
            } else if (file.fieldname === 'comparisonMedia') {
                folder = 'companions/comparisonVideos'; // Pasta para vídeo de comparação
            } else if (file.fieldname === 'profilePic') {
                folder = 'companions/profile'; // Pasta para foto de perfil
            }

            // Nome único para o arquivo
            const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
            cb(null, fileName); // Define o nome do arquivo
        },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB para os arquivos
    fileFilter: (req, file, cb) => {
        // Apenas imagens são permitidas
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas imagens e vídeos são permitidos!"), false);
        }
    },
}).fields([
    { name: 'fileFront', maxCount: 1 }, // Documento da frente
    { name: 'fileBack', maxCount: 1 }, // Documento de trás
    { name: 'comparisonMedia', maxCount: 1 }, // Vídeo de comparação
    { name: 'profilePic', maxCount: 1 }, // Foto de perfil
]);


// Exportações ESM
export const uploadRegisterMiddleware = uploadRegister;

export const uploadProfileAndBannerMiddleware = uploadProfileAndBanner.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 },
]);

export const uploadCarrouselImages = uploadCarrouselImage.array('carrouselImages', 5);
export const uploadSingleVideo = uploadVideo.single('comparisonMedia');
export const uploadDocuments = upload.fields([
  { name: 'fileFront', maxCount: 1 },
  { name: 'fileBack', maxCount: 1 },
]);
export const uploadStorySingle = uploadStory.single('media');
export const uploadFeedSingle = uploadFeed.single('media');

export { wasabiS3, bucketName };