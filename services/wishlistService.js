import { pool } from '../config/db-config.js';

export const getProductsInCart = async (userId) => {
    try {
        // 1. 해당 유저의 장바구니를 가져오기
        let [cart] = await pool.query('SELECT * FROM cart WHERE user_id = ?', [userId]);

        if (cart.length === 0) {
            return { count: 0, products: [] };  // 장바구니가 비어있는 경우 빈 배열과 count 0 반환
        }

        const cartId = cart[0].id;

        // 2. 장바구니의 폴더를 가져오기
        let [folders] = await pool.query('SELECT * FROM folder WHERE cart_id = ?', [cartId]);

        if (folders.length === 0) {
            return { count: 0, products: [] };  // 폴더가 없는 경우 빈 배열과 count 0 반환
        }

        // 3. 각 폴더에 포함된 제품 목록을 가져오기
        const [products] = await pool.query(`
            SELECT p.id AS product_id, p.name, p.en_price, p.won_price, p.image, p.manufacturing_country
            FROM product p
            JOIN cart_folder_product cfp ON p.id = cfp.product_id
            JOIN folder f ON cfp.folder_id = f.id
            WHERE f.cart_id = ?
            GROUP BY p.id
        `, [cartId]);

        // 4. 제품 개수 (count)
        const count = products.length;

        return {
            data: {
                count, // 제품 개수
                products // 제품 목록
            }
        };
    } catch (error) {
        console.error('Error retrieving products from cart', error);
        throw error;
    }
};
