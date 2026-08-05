// backend/services/storageService.js
// Guarda as imagens enviadas pelos usuarios.
// Em producao (Render/Vercel) o disco e efemero: a cada deploy os arquivos somem.
// Se as variaveis do Cloudinary estiverem configuradas, envia para a nuvem.
// Caso contrario, salva localmente (adequado apenas para desenvolvimento).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

function cloudinaryConfigurado() {
  return Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
  );
}

function baseUrl() {
  const url = process.env.BASE_URL || 'http://localhost:' + (process.env.PORT || 3001);
  return url.replace(/\/$/, '');
}

function getCloudinary() {
  const cloudinary = require('cloudinary').v2;
  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }
  return cloudinary;
}

async function saveFile(file) {
  if (!file || !file.buffer) return null;

  if (cloudinaryConfigurado()) {
    const cloudinary = getCloudinary();
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'miaudote' },
        (error, result) => (error ? reject(error) : resolve(result.secure_url))
      );
      stream.end(file.buffer);
    });
  }

  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  const nome =
    Date.now() +
    '-' +
    crypto.randomBytes(6).toString('hex') +
    path.extname(file.originalname || '');
  await fs.promises.writeFile(path.join(UPLOAD_DIR, nome), file.buffer);
  return baseUrl() + '/uploads/' + nome;
}

async function saveFiles(files) {
  const lista = Array.isArray(files) ? files : [];
  const urls = [];
  for (const file of lista) {
    const url = await saveFile(file);
    if (url) urls.push(url);
  }
  return urls;
}

module.exports = { saveFile, saveFiles, baseUrl, cloudinaryConfigurado };
