const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

// Configuração da conexão com a Wasabi
const wasabiS3 = new S3Client({
    region: process.env.WASABI_REGION,
    endpoint: process.env.WASABI_ENDPOINT,
    credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY,
        secretAccessKey: process.env.WASABI_SECRET_KEY,
    },
});

module.exports = wasabiS3;
