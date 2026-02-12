import express from 'express';
import { autologin, login, logout, register,changePassword, deleteAccount } from '../controllers/authController.js';

export const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/autologin', autologin);
router.post('/logout', logout);
router.post('/deleteAccount', deleteAccount);
router.post('/changePassword', changePassword);

export default router;