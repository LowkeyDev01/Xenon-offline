import Queue from 'bull'

const downloadQueue = new Queue('downloads', {
    redis: { host: '127.0.0.1', port: 6379 }
});

downloadQueue.process(1, async (job) => {
    const { username, file_path, creator } = job.data;

    const result = await pool.query('SELECT * FROM download_logs WHERE username = $1 AND file_path = $2', [username, file_path]);
    if (result.rows.length > 0) {
        return { success: true };
    }

    await pool.query('INSERT INTO download_logs (username, file_path, creator, is_downloaded) VALUES ($1, $2, $3, $4)', [username, file_path, creator, true]);
})

export default downloadQueue;