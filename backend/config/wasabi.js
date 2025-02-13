const { S3Client  } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
require("dotenv").config();

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
                cb(null, "video/mp4"); // Força o tipo correto para vídeos
            } else {
                cb(null, multerS3.AUTO_CONTENT_TYPE);
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

// Middleware para upload de um único arquivo (para vídeos)
exports.uploadSingleVideo = uploadVideo.single("video");

// Middleware para upload de imagens (ex: documentos)
exports.uploadDocuments = upload.fields([
    { name: "fileFront", maxCount: 1 },
    { name: "fileBack", maxCount: 1 },
]);

exports.uploadStorySingle = uploadStory.single("media");

exports.uploadFeedSingle = uploadFeed.single("media");

exports.wasabiS3 = wasabiS3;
exports.bucketName = bucketName;