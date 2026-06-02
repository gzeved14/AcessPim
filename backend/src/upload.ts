import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// O caminho onde as fotos serão salvas
const uploadFolder = path.resolve(__dirname, '..', '..', 'uploads', 'fotos');

export const uploadConfig = {
    directory: uploadFolder,
    storage: multer.diskStorage({
        destination: uploadFolder,
        filename: (req, file, cb) => {
            const fileHash = crypto.randomBytes(10).toString('hex');
            const fileName = `${fileHash}-${file.originalname.replace(/\s/g, '_')}`;
            return cb(null, fileName);
        }
    })
};

export const upload = multer(uploadConfig);