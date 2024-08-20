// cartService.js
import { pool } from '../config/db-config.js';

export const addProductToCart = async (userId, productId) => {
    try {
        // 1. 해당 유저의 장바구니를 가져오기 (없다면 새로 생성)
        let [cart] = await pool.query('SELECT * FROM cart WHERE user_id = ?', [userId]);

        if (cart.length === 0) {
            await pool.query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
            [cart] = await pool.query('SELECT * FROM cart WHERE user_id = ?', [userId]);
        }

        const cartId = cart[0].id;

        // 2. 해당 장바구니에 폴더가 있는지 확인 (없다면 새로 생성)
        let [folder] = await pool.query('SELECT * FROM folder WHERE cart_id = ?', [cartId]);

        if (folder.length === 0) {
            // 폴더가 없으면 새로 생성하고, count를 0으로 설정
            await pool.query('INSERT INTO folder (name, cart_id, count) VALUES (?, ?, ?)', ['Default Folder', cartId, 0]);
            [folder] = await pool.query('SELECT * FROM folder WHERE cart_id = ?', [cartId]);
        }

        const folderId = folder[0].id;

        // 3. 해당 폴더에 이미 동일한 제품이 있는지 확인
        let [cartProduct] = await pool.query('SELECT * FROM cart_folder_product WHERE folder_id = ? AND product_id = ?', [folderId, productId]);

        if (cartProduct.length === 0) {
            // 4. 동일한 제품이 없다면 cart_folder_product에 새로 추가하고 폴더의 count를 1 증가시킴
            await pool.query('INSERT INTO cart_folder_product (folder_id, product_id) VALUES (?, ?)', [folderId, productId]);
            await pool.query('UPDATE folder SET count = count + 1 WHERE id = ?', [folderId]);

            // 5. 유저가 이 제품을 장바구니에 담았으므로, user_heart 테이블에도 추가
            await pool.query(`
                INSERT INTO user_heart (user_id, product_id) 
                VALUES (?, ?) 
                ON DUPLICATE KEY UPDATE product_id = product_id`, 
                [userId, productId]);
        } else {
            // 4-1. 동일한 제품이 있으면 count를 변동하지 않음
            console.log('Product already exists in the folder. Count remains unchanged.');
        }

        // 6. 제품 정보와 폴더의 총 수량을 함께 가져오기
        const [products] = await pool.query(`
            SELECT p.name, p.en_price, p.won_price, p.image, f.count 
            FROM product p
            JOIN cart_folder_product cfp ON p.id = cfp.product_id
            JOIN folder f ON cfp.folder_id = f.id
            WHERE p.id = ? AND f.cart_id = ?
        `, [productId, cartId]);

        console.log('Product Data:', products);  // 쿼리 결과를 로그로 출력

        if (products.length === 0) {
            console.error('Product not found in the database or cart.');
            return {
                message: 'Product not found in the database or cart.',
                data: null
            };
        }

        // 7. 리뷰 테이블에서 해당 product_id의 평균 rating 계산 및 리뷰 개수 가져오기
        const [reviewStats] = await pool.query(`
            SELECT 
                AVG(rating) AS avgRating, 
                COUNT(*) AS reviewCount 
            FROM review 
            WHERE product_id = ?
        `, [productId]);

        // 평균 평점을 0.5 단위로 반올림
        const avgRating = reviewStats[0].avgRating || 0; // 리뷰가 없을 경우 avgRating이 null일 수 있으므로 기본값 0 설정
        const roundedRating = Math.round(avgRating * 2) / 2;

        console.log('Review Stats:', { roundedRating, reviewCount: reviewStats[0].reviewCount });

        return {
            product: products[0],  // 상품 정보와 수량 반환
            review: {
                rating: roundedRating,  // 0.5 단위로 반올림된 평점
                reviewCount: reviewStats[0].reviewCount  // 리뷰 개수
            },
            heart: true // 유저가 장바구니에 담은 상태를 하트로 표시
        };

    } catch (error) {
        console.error('Error executing the query', error);
        throw error;
    }
};



export const removeProductFromCart = async (userId, productId) => {
    try {
        // 1. 해당 유저의 장바구니를 가져오기
        let [cart] = await pool.query('SELECT * FROM cart WHERE user_id = ?', [userId]);

        if (cart.length === 0) {
            return {
                message: 'Cart not found for the user.',
                data: null
            };
        }

        const cartId = cart[0].id;

        // 2. 해당 장바구니에 폴더가 있는지 확인
        let [folder] = await pool.query('SELECT * FROM folder WHERE cart_id = ?', [cartId]);

        if (folder.length === 0) {
            return {
                message: 'Folder not found in the cart.',
                data: null
            };
        }

        const folderId = folder[0].id;

        // 3. 해당 폴더에서 제품이 있는지 확인
        let [cartProduct] = await pool.query('SELECT * FROM cart_folder_product WHERE folder_id = ? AND product_id = ?', [folderId, productId]);

        if (cartProduct.length === 0) {
            return {
                message: 'Product not found in the folder.',
                data: null
            };
        }

        // 4. 동일한 제품이 있으면 수량을 1 감소시키고, 수량이 0이 되면 제품을 장바구니에서 제거
        const currentQuantity = cartProduct[0].quantity;

        if (currentQuantity > 1) {
            // 수량을 1 감소시킴
            await pool.query('UPDATE cart_folder_product SET quantity = quantity - 1 WHERE folder_id = ? AND product_id = ?', [folderId, productId]);
        } else {
            // 수량이 0이 되면 제품을 장바구니에서 제거
            await pool.query('DELETE FROM cart_folder_product WHERE folder_id = ? AND product_id = ?', [folderId, productId]);
        }

        // 5. 폴더의 count 값을 업데이트
        await pool.query('UPDATE folder SET count = count - 1 WHERE id = ?', [folderId]);

        return {
            message: 'Product removed from cart successfully',
            data: null
        };
    } catch (error) {
        console.error('Error executing the query', error);
        throw error;
    }
};