import { Router } from 'express';
import {
    showSignup,
    signup,
    showSignin,
    signin,
    signout,
} from '../controllers/auth.js';

const router = Router();

router.get('/signup', showSignup);
router.post('/signup', signup);
router.get('/signin', showSignin);
router.post('/signin', signin);
router.post('/signout', signout);

export default router;