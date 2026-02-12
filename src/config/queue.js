import Queue from 'bull';
import pool from './db.js'; // Ensure this points to your Postgres connection file

// 1. Initialize the Queue
const downloadQueue = new Queue('downloads', {
    redis: { host: '127.0.0.1', port: 6379 }
});

// 2. Define the Process logic
downloadQueue.process(1, async (job) => {
    const { username, file_path, creator } = job.data;

    try {
        console.log(`Processing job ${job.id} for user: ${username}`);

        // Step A: Check if this download is already logged (Prevent duplicates)
        const checkExists = await pool.query(
            'SELECT * FROM download_logs WHERE username = $1 AND file_path = $2', 
            [username, file_path]
        );

        if (checkExists.rows.length > 0) {
            console.log(`Log already exists for ${file_path}. Skipping insert.`);
            return { status: 'skipped', message: 'Duplicate entry' };
        }

        // Step B: Insert the new log
        const result = await pool.query(
            'INSERT INTO download_logs (username, file_path, creator, is_downloaded) VALUES ($1, $2, $3, $4) RETURNING *', 
            [username, file_path, creator, true]
        );

        console.log('Successfully logged to database:');
        console.log('-'.repeat(50));
        console.log(result.rows[0]);

        return { status: 'success', logId: result.rows[0].id };

    } catch (err) {
        console.error(`Error processing job ${job.id}:`, err);
        // Throwing the error tells Bull the job failed so it can retry later
        throw err; 
    }
});

export default downloadQueue;