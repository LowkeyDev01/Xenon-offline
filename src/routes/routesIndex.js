import express from 'express';
import authRoutes from './authRoutes.js'
import movieRoutes from './moviesRoutes.js'
import uploadRoute from './uploadRoute.js'
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);

export default router;