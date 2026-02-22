import redisClient from '../config/redis.js';
import pool from '../config/db.js';
import 'dotenv/config';
import upload from '../config/multer.js';
import downloadQueue from '../config/queue.js'
import crypto from 'crypto'


// Helper to create the "Ticket"
const generateSignedUrl = (movieId) => {
    const secret = process.env.STREAM_SECRET; 
    const hours = 3; 
    const expires = Date.now() + (hours * 60 * 60 * 1000); // Current time + 6 hours

    // Create a "Hologram" using the ID and Expiry
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${movieId}${expires}`)
        .digest('hex');

    return `/movies/watch/${movieId}?expires=${expires}&signature=${signature}`;
};

export const movies = async (req, res) => {
    const cacheKey = 'movies_list';
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
        return res.json(JSON.parse(cached));
    }

    try {
        const moviesResult = await pool.query('SELECT * FROM movies LIMIT 50 OFFSET 0');
        if (moviesResult.rows.length === 0) {
            return res.status(400).json({ error: 'No movies found' });
        }

        const results = moviesResult.rows.map(movie => ({
            file_id: movie.file_id,
            movie_name: movie.movie_name,
            // Simple direct link to your watch route
            file_path: generateSignedUrl(movie.file_id), 
            cover_img: movie.cover_img,
            expiry_date: movie.expiry_date
        }));

        await redisClient.set(cacheKey, JSON.stringify(results), { EX: 60 });
        res.json(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
export const tag = async (req, res) => {
    const { filter } = req.params;
    let query;
    let params = [];
    
    try {
        if (filter === 'All') {
            query = 'SELECT * FROM movies LIMIT 50 OFFSET 0';
        } else {
            query = 'SELECT * FROM movies WHERE category = $1';
            params = [filter];
        }

        const movies = await pool.query(query, params);
        
        if (movies.rows.length === 0) {
            return res.status(404).json({ error: 'No movies found' });
        }

        const results = movies.rows.map(movie => ({
            file_id: movie.file_id,
            movie_name: movie.movie_name,
            // Pointing to your watch route
            file_path: generateSignedUrl(movie.file_id),
            cover_img: movie.cover_img,
            expiry_date: movie.expiry_date
        }));

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const search = async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.json([]);
    }

    try {
        const searchItem = `%${q}%`;
        const result = await pool.query(
            'SELECT * FROM movies WHERE movie_name ILIKE $1 OR category ILIKE $1 LIMIT 20', 
            [searchItem]
        );

        // Format search results to use the Watch Route
        const results = result.rows.map(movie => ({
            file_id: movie.file_id,
            movie_name: movie.movie_name,
            file_path: generateSignedUrl(movie.file_id),
            cover_img: movie.cover_img,
            expiry_date: movie.expiry_date
        }));

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
//Upload
export const uploadHandler = [upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]), async (req, res) => {
    try {

        const { sessionId, title, category } = req.body
        const { file, cover } = req.files;

        if (!sessionId || !title || !category) {
            return res.status(400).json({ error: 'Missing fields' });
        }
        if (!file || !cover) {
            return res.status(400).json({ error: 'Missing files' });
        }
        const creator = await pool.query('SELECT username FROM sessions WHERE session_id = $1', [sessionId]);
        if (!creator.rows[0]) {
            return res.status(401).json({ error: 'Unathorised: Invalid session!' })
        }
        const username = creator.rows[0].username
        const mainFilePath = file[0].filename;
        const coverImgPath = cover[0].filename;

        const relativeFile = `uploads/${mainFilePath}`
        const relativeImg = `uploads/${coverImgPath}`
        const now = new Date();
        const expiry_date = new Date();
        expiry_date.setDate(now.getDate() + 5);

        await pool.query('INSERT INTO movies (movie_name, file_path, cover_img, category, creator, uploaded_at, expiry_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [title, relativeFile, relativeImg, category, username, now, expiry_date]);

        await redisClient.del('movies_list')
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}]
//Download
export const download = async (req, res) => {
    try {
        const { file_path, sessionId } = req.body

        const userName = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionId]);
        const rusername = userName.rows[0];
        if (!rusername) {
            return res.status(400).json({ error: 'User not logged in' })
        }
        const { username } = rusername;
        //Checking if movie exists
        console.log("Looking for path:", file_path);
        const checkMovie = await pool.query('SELECT * FROM movies WHERE file_id = $1', [file_path]);

        if (!checkMovie.rows[0]) {
            return res.status(400).json({ error: 'Movie does not exists!' })
        }
        const { creator } = checkMovie.rows[0]
        //Checking if downloadlog already exists
        const hey = await downloadQueue.add({ username, file_path, creator })

        res.json({ success: 'recorded' })
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
import path from 'path';


export const watchMovie = async (req, res) => {
    const { movieId } = req.params;
    const { expires, signature } = req.query; // Get values from the URL
    const secret = process.env.STREAM_SECRET;

    // 1. Is the ticket too old?
    if (Date.now() > parseInt(expires)) {
        return res.status(403).send("Ticket expired! Refresh the page to get a new one.");
    }

    // 2. Is the "Hologram" valid?
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${movieId}${expires}`)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(403).send("Invalid ticket signature.");
    }

    // 3. If everything is cool, send the file
    const result = await pool.query('SELECT file_path FROM movies WHERE file_id = $1', [movieId]);
    const absolutePath = path.join(process.cwd(), result.rows[0].file_path);
    res.sendFile(absolutePath);
};