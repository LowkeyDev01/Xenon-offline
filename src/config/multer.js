import multer from 'multer';
import crypto from 'crypto'
import fs from 'fs';
import path from 'path';

const storage = new multer.diskStorage(
    {
        destination: (req, file, cb) => {
            const folder = 'uploads';
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

export const upload = multer({ storage });