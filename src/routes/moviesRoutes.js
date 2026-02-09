import express from 'express';
import { movies, search, tag, uploadHandler, download } from '../controllers/moviesController.js';
import rateLimit from 'express-rate-limit';

const searchLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 search requests per window
    message: "Too many searches, take a breather!",
});

const router = express.Router();

router.get('/all', movies);
router.get('/search', searchLimiter, search);
router.get('/:filter', tag);
router.post('/upload', uploadHandler);
router.post('/download', download);

export default router;