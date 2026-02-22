import { fileURLToPath } from 'url'
import { dirname } from 'path'
import path from 'path';
import fs from 'fs';
import pool from '../config/db.js';
import redisClient from '../config/redis.js'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const deleteExpiredMovies = async () => {
    try {
        const result = await pool.query('SELECT file_id, file_path, cover_img FROM movies WHERE expiry_date <= NOW()')
        if (result.rows.length === 0) return;
        for (let row of result.rows) {
            const files = [row.file_path, row.cover_img]

            for (let file of files) {
                if (!file) continue;
                const filePath = path.join(process.cwd(), file);
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`${filePath} Deleted`);
                    } else {
                        console.log(`${filePath} already gone, skipping...`);
                    }
                }
                catch (err) {
                    console.error(err)
                }

            }
            await pool.query('DELETE FROM movies WHERE file_id = $1', [row.file_id])
        }
        await redisClient.del('movies_list');
        console.log('Deleted from Database');
    }

    catch (err) {
        console.error(err)
    }
}

export default deleteExpiredMovies;