import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import pool from './db.js';
import crypto from 'crypto';


const PORT = 8080;


const app = express();
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.urlencoded({ extended: true }))
app.use(express.static('frontend'))
app.use('/uploads', express.static('uploads'))
app.use(express.json());

//------------
//Multer storage
//------------




downloadQueue.process(1, async (job) => {
    const { username, file_path, creator } = job.data;

    const result = await pool.query('SELECT * FROM download_logs WHERE username = $1 AND file_path = $2', [username, file_path]);
    if (result.rows.length > 0) {
        return { success: true };
    }

    await pool.query('INSERT INTO download_logs (username, file_path, creator, is_downloaded) VALUES ($1, $2, $3, $4)', [username, file_path, creator, true]);
})

app.post('/upload', upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]), async (req, res) => {

    const { sessionId, title, category } = req.body
    const { file, cover } = req.files;

    if (!sessionId || !title || !category) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    if (!file || !cover) {
        return res.status(400).json({ error: 'Missing files' });
    }

    const mainFilePath = file[0].path;
    const coverImgPath = cover[0].path;
    const creator = await pool.query('SELECT username FROM sessions WHERE session_id = $1', [sessionId]);
    const now = new Date();
    const expiry_date = new Date();
    expiry_date.setDate(now.getDate() + 5);

    await pool.query('INSERT INTO movies (movie_name, file_path, cover_img, category, creator, uploaded_at, expiry_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [title, mainFilePath, coverImgPath, category, creator.rows[0].username, now, expiry_date]);
    res.json({ success: true });
})


//Change password
app.post('/changepassword', async (req, res) => {

    const { sessionId, oldpass, newpass } = req.body;
    if (!sessionId || !newpass || !oldpass) {
        res.status(400).json({ error: 'Invalid credentials' })
    }
    try {
        const result = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionId]);
        const sessionuser = result.rows[0];
        if (!sessionuser) {
            return res.status(400).json({ error: "User not LoggedIn" })
        }
        const user = sessionuser.username;

        const fetchPass = await pool.query('SELECT * FROM xenon_user WHERE username = $1', [user])
        const { password } = fetchPass.rows[0]
        const match = await bcrypt.compare(oldpass, password);
        if (!match) {
            return res.status(401).json({ error: "Old password is wrong" })
        }
        if (oldpass === newpass) {
            return res.status(400).json({ error: 'Password is the same tf?!' })
        }
        const hash = await bcrypt.hash(newpass, 10)
        await pool.query('UPDATE xenon_user SET password = $1 WHERE username = $2', [hash, user]);
        res.json({ success: true })
    }
    catch (err) {
        console.error(err.message);
    }
})



app.post('/download', async (req, res) => {
    try {
        const { file_path, sessionId } = req.body

        const userName = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionId]);
        const rusername = userName.rows[0];
        if (!rusername) {
            return res.status(400).json({ error: 'User not logged in' })
        }
        const { username } = rusername;
        //Checking if movie exists

        const checkMovie = await pool.query('SELECT * FROM movies WHERE file_path = $1', [file_path]);

        if (!checkMovie.rows[0]) {
            return res.status(400).json({ error: 'Movie does not exists!' })
        }
        const { creator } = checkMovie.rows[0]
        //Checking if downloadlog already exists
        await downloadQueue.add({ username, file_path, creator })
        res.json({ success: true })
    }
    catch (err) {
        console.error(err)
    }
})

app.get('/search', async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.json([]);
    }

    const searchItem = `%${q}%`;

    const result = await pool.query('SELECT * FROM movies WHERE movie_name ILIKE $1 OR category ILIKE $1', [searchItem]);
    res.json(result.rows)
})
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${PORT}`);

    deleteExpiredMovies();
    setInterval(deleteExpiredMovies, 1000 * 60 * 60);
})