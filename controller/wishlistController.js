import { getProductsInCart } from '../services/wishlistService.js';

export const getWishlist = async (req, res) => {
    try {
        const { user_id } = req.query;  // user_id를 요청 쿼리에서 가져옴

        if (!user_id) {
            return res.status(400).json({ message: 'user_id is required' });
        }

        const result = await getProductsInCart(user_id);

        res.status(200).json({ 
            message: 'Products retrieved successfully',
            data: result // 제품 개수와 목록 반환
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving products from cart', error: error.message });
    }
};
