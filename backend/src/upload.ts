import multer from 'multer';
import path from 'path';

// 🎯 Substitua a linha 6 por isso (Sem usar import.meta):
const uploadFolder = path.resolve(__dirname, '..', 'tmp');

export const uploadConfig = {
  directory: uploadFolder,
  storage: multer.diskStorage({
    destination: uploadFolder,
    filename(request, file, callback) {
      const fileHash = Date.now();
      const fileName = `${fileHash}-${file.originalname}`;
      return callback(null, fileName);
    },
  }),
};