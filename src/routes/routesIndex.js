import express from 'express';
import authRoutes from './authRoutes.js'
import movieRoutes from './moviesRoutes.js'

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);

export default router;