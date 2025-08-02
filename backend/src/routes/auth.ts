import express from 'express';
import authRoutes from '../auth/authRoutes';
import passwordResetRouter from './auth/passwordReset';
import emailTestRouter from './auth/emailTest';

const router = express.Router();

// Mount authentication routes
router.use(authRoutes);

// Mount sub-routers
router.use(passwordResetRouter);
router.use(emailTestRouter);

export default router;
