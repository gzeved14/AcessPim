import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import type { Request } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// O caminho onde as fotos serão salvas
const uploadFolder = path.resolve(__dirname, '..', '..', 'uploads', 'fotos');

export const uploadConfig = {
    directory: uploadFolder,
    storage: multer.diskStorage({
        destination: uploadFolder,
        filename: (_req: Request, file: { originalname: string }, cb: (error: Error | null, filename: string) => void) => {
            const fileHash = crypto.randomBytes(10).toString('hex');
            const fileName = `${fileHash}-${file.originalname.replace(/\s/g, '_')}`;
            return cb(null, fileName);
        }
    })
};

export const upload = multer(uploadConfig);