import { Router } from 'express';
import { getWishlist } from '../controller/wishlistController.js';

const router = Router();

router.get('/', getWishlist); // GET 요청을 처리하는 라우트

export default router;
