import { Router } from 'express';
import statusRouter from './devices/status';
import controlRouter from './devices/control';
import historyRouter from './devices/history';

const router = Router();

// Mount sub-routers
router.use(statusRouter);
router.use(controlRouter);
router.use(historyRouter);

export default router;
