import redisClient from '../config/redis.js';
import pool from '../config/db.js';


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