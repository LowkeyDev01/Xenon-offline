import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import pool from './db.js';
import crypto from 'crypto';
import Queue from 'bull'


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

//Register
app.post('/register', async (req, res) => {
    try {
        const { username, password, signup_code } = req.body;
        const valid_code = await pool.query('SELECT * FROM codes WHERE code_string = $1 AND is_used = false', [signup_code])
        if (!username || !password) {
            return res.status(400).json('Invalid Credentials')
        }
        if (valid_code.rows.length === 0) {
            return res.status(400).json('Invalid Credentials')
        }
        //Hashing the passwords
        const { account_type } = valid_code.rows[0]
        const hashed = await bcrypt.hash(password, 10);

        //Expiry date
        const now = new Date();
        const expiry_date = new Date();
        expiry_date.setDate(now.getDate() + 30);

        //creating automatic session
        const sessionId = crypto.randomBytes(10).toString('hex').toLowerCase();

        await pool.query('INSERT INTO xenon_user (username, password, role, signup_code, expiry_date) VALUES ($1, $2, $3, $4, $5)', [username, hashed, account_type, signup_code, expiry_date]);
        await pool.query('UPDATE codes SET used_at = NOW(), is_used = true WHERE code_string = $1', [signup_code])
        await pool.query('INSERT INTO sessions (session_id, username) VALUES ($1, $2)', [sessionId, username])
        res.json({ success: true, sessionId });
    }
    catch (err) {
        return res.status(400).json({ error: "username already exists" })

    }
})

//Login

app.post('/login', async (req, res) => {
    const { userName, password } = req.body;
    const result = await pool.query('SELECT * FROM xenon_user WHERE username = $1 AND expiry_date > NOW()', [userName]);

    const user = result.rows[0];
    if (!user) {
        return res.status(400).json({ error: "Invalid Credentials" })
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ error: "Invalid Credentials" })
    }
    const now = new Date();
    if (user.expiry_date < now) {
        return res.status(401).json({ status: 'Account Expired' })
    }
    const checkses = await pool.query('SELECT * FROM sessions WHERE username = $1', [userName])
    if (checkses.rows.length > 0) {
        return res.status(400).json({ error: 'Another device is logged in' })
    }
    //creating automatic session
    const sessionId = crypto.randomBytes(10).toString('hex').toLowerCase();
    await pool.query('INSERT INTO sessions (session_id, username) VALUES ($1, $2)', [sessionId, userName])
    res.status(200).json({ sessionId })
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

app.post('/autologin', async (req, res) => {
    try {
        const { sessionId } = req.body;

        const result = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionId]);
        const sessionuser = result.rows[0];
        if (!sessionuser) {
            return res.status(400).json({ error: "Invalid Credentials" })
        }
        const user = sessionuser.username;
        const realuser = await pool.query('SELECT * FROM xenon_user WHERE username = $1', [user])
        if (!realuser.rows[0]) {
            return res.status(400).json({ error: 'User not found' })
        }
        const { username, role, expiry_date } = realuser.rows[0]
        const creator = await pool.query('SELECT * FROM download_logs WHERE creator = $1', [username])
        const creatorNum = creator.rows.length
        res.json({ username, role, expiry_date, creatorNum })
    }
    catch (err) {
        console.error(err);
        return;
    }
})

app.post('/logout', async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(401).json({ error: 'You were never Logged in' });
        }
        await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Logout failed' });
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
app.get('/movies', async (req, res) => {
    const cacheKey = 'movies_list';
    const cached = await redisClient.get(cacheKey);
    console.log('Cached value:', cached);
    if (cached) {
        return res.json(JSON.parse(cached));
    }

    try {
        const movies = await pool.query('SELECT * FROM movies LIMIT 50 OFFSET 0');
        if (movies.rows.length === 0) {
            return res.status(400).json({ error: 'No movies found' })
        }
        const results = movies.rows.map(movie => ({
            file_id: movie.file_id,
            movie_name: movie.movie_name,
            file_path: movie.file_path,
            cover_img: movie.cover_img,
            expiry_date: movie.expiry_date
        }))

        await redisClient.set(cacheKey, JSON.stringify(results), { EX: 60 });
        res.json(results)
    }
    catch (err) {
        console.error(err)
    }
})
app.get('/movies/:filter', async (req, res) => {

    const { filter } = req.params
    let query;
    let params = []
    try {
        if (filter === 'All') {
            query = 'SELECT * FROM movies LIMIT 50 OFFSET 0';
        }
        else {
            query = 'SELECT * FROM movies WHERE category = $1';
            params = [filter];
        }
        const movies = await pool.query(query, params)
        if (movies.rows.length === 0) {
            return res.status(400).json({ error: 'No movies found' })
        }
        const results = movies.rows.map(movie => ({
            file_id: movie.file_id,
            movie_name: movie.movie_name,
            file_path: movie.file_path,
            cover_img: movie.cover_img,
            expiry_date: movie.expiry_date
        }))

        res.json(results)
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