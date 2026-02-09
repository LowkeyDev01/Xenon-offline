import multer from 'multer';
import crypto from 'crypto'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = new multer.diskStorage(
    {
        destination: (req, file, cb) => {
            const folder = path.resolve(__dirname, '../../uploads');
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }
            cb(null, folder)
        },
        filename: (req, file, cb) => {
            let originalName = file.originalname;
            const ext = path.extname(originalName);


            const uniqueFilename = `${crypto.randomBytes(10).toString('hex')}-${Date.now()}${ext}`;
            cb(null, uniqueFilename);
        }
    }

);

const upload = multer({ storage });

export default upload;