import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import pool from './db.js';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs'
const PORT = 8080



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
            const name = path.basename(originalName, ext);

            const randomNum = Math.floor(Math.random() * 10000);
            const uniqueFilename = `${name}-${randomNum}-${Date.now()}${ext}`;
            cb(null, uniqueFilename);
        }
    }

);

const upload = multer({ storage });

app.post('/uploads', upload.fields([
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
    const { username, role, expiry_date } = user
    res.status(200).json({ username, role, expiry_date, sessionId })
})

//Change password
app.post('/changepassword', async (req, res) => {

    const { username, newpass, oldpass } = req.body;
    if (!username || !newpass || !oldpass) {
        res.status(400).json({ error: 'Invalid credentials' })
    }
    try {
        const result = await pool.query('SELECT * FROM xenon_user WHERE username = $1', [username])

        const user = result.rows[0];
        if (!user) {
            return res.status(400).json({ error: 'Wrong password' });
        }
        const match = await bcrypt.compare(oldpass, user.password);
        if (!match) {
            return res.status(401).json({ error: "Old password is wrong" })
        }
        const hash = await bcrypt.hash(newpass, 10)
        await pool.query('UPDATE xenon_user SET password = $1 WHERE username = $2', [hash, username]);
        res.json('Change successful!')
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
        res.json({ username, role, expiry_date })
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${PORT}`)
})