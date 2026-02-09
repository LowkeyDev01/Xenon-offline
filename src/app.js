import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import pool from './db.js';
import path from 'path'


const PORT = 8080;


const app = express();
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.resolve(__dirname, '../public')))
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))
app.use(express.json());


downloadQueue.process(1, async (job) => {
    const { username, file_path, creator } = job.data;

    const result = await pool.query('SELECT * FROM download_logs WHERE username = $1 AND file_path = $2', [username, file_path]);
    if (result.rows.length > 0) {
        return { success: true };
    }

    await pool.query('INSERT INTO download_logs (username, file_path, creator, is_downloaded) VALUES ($1, $2, $3, $4)', [username, file_path, creator, true]);
})


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${PORT}`);

    deleteExpiredMovies();
    setInterval(deleteExpiredMovies, 1000 * 60 * 60);
})