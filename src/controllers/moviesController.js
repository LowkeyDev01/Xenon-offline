import redisClient from '../config/redis.js';
import pool from '../config/db.js';
import upload from '../config/multer.js';
import downloadQueue from '../config/queue.js'

export const movies = async (req, res) => {
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
}
export const tag = async (req, res) => {

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
}

export const search = async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.json([]);
    }

    const searchItem = `%${q}%`;

    const result = await pool.query('SELECT * FROM movies WHERE movie_name ILIKE $1 OR category ILIKE $1 LIMIT 20', [searchItem]);
    res.json(result.rows)
}
//Upload
export const uploadHandler = [upload.fields([
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

    const mainFilePath = file[0].filename;
    const coverImgPath = cover[0].filename;

    const relativeFile = `uploads/${mainFilePath}`
    const relativeImg = `uploads/${coverImgPath}`
    const creator = await pool.query('SELECT username FROM sessions WHERE session_id = $1', [sessionId]);
    const now = new Date();
    const expiry_date = new Date();
    expiry_date.setDate(now.getDate() + 5);

    await pool.query('INSERT INTO movies (movie_name, file_path, cover_img, category, creator, uploaded_at, expiry_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [title, relativeFile, relativeImg, category, creator.rows[0].username, now, expiry_date]);

    await redisClient.del('movies_list')
    res.json({ success: true });
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

        const checkMovie = await pool.query('SELECT * FROM movies WHERE file_path = $1', [file_path]);

        if (!checkMovie.rows[0]) {
            return res.status(400).json({ error: 'Movie does not exists!' })
        }
        const { creator } = checkMovie.rows[0]
        //Checking if downloadlog already exists
        const hey = await downloadQueue.add({ username, file_path, creator })

        res.json({ success: 'recorded' })
    }
    catch (err) {
        console.error(err)
    }
}