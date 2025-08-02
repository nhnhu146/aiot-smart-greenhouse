import express from 'express';
import passwordResetRouter from './auth/passwordReset';
import emailTestRouter from './auth/emailTest';

const router = express.Router();

// Mount sub-routers
router.use(passwordResetRouter);
router.use(emailTestRouter);

export default router;
