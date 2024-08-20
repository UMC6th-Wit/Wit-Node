import { Router } from 'express';
import { addToCart } from '../controller/cartController.js';
import { removeToCart } from '../controller/cartController.js';
const router = Router();


router.post('/:productId', addToCart);
router.post('/delete-cart-product/:productId', removeToCart);
export default router;