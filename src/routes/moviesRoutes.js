import express from 'express';
import { movies, search, tag, uploadHandler,download } from '../controllers/moviesController.js';

const router = express.Router();

router.get('/all', movies);
router.get('/:filter', tag);
router.get('/search', search);;
router.post('/upload', uploadHandler);
router.post('/download', download);

export default router;