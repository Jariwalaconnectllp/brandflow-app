const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const USE_CLOUDINARY = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let cloudinary, CloudinaryStorage;
if (USE_CLOUDINARY) {
  try {
    cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage: CS } = require('multer-storage-cloudinary');
    CloudinaryStorage = CS;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('✅ Cloudinary image storage configured');
  } catch (e) {
    console.warn('⚠️  Cloudinary not available, using local storage');
  }
}

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images (JPEG/PNG/WebP) and PDFs allowed'), false);
};

function createUpload(folder) {
  let storage;
  if (USE_CLOUDINARY && CloudinaryStorage) {
    storage = new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => ({
        folder: `brandflow/${folder}`,
        public_id: uuidv4(),
        allowed_formats: ['jpg','jpeg','png','webp','gif','pdf'],
        resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
      }),
    });
  } else {
    const uploadDir = path.join(__dirname, '../../uploads', folder);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    storage = multer.diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`),
    });
  }
  return multer({ storage, fileFilter, limits: { fileSize: 10*1024*1024, files: 15 } });
}

const uploadRecce       = createUpload('recce');
const uploadVendor      = createUpload('vendor');
const uploadAttachments = createUpload('requests');

function getFileUrl(file) {
  if (file.path && file.path.startsWith('http')) return file.path;
  const relative = (file.path||'').replace(/\\/g, '/');
  const idx = relative.indexOf('/uploads/');
  return idx !== -1
    ? `/api${relative.substring(idx)}`
    : `/api/uploads/${file.filename||file.originalname}`;
}

module.exports = { uploadRecce, uploadVendor, uploadAttachments, getFileUrl };
