import { pool } from '../config/db-config.js';

export const createFolderWithProducts = async (userId, product_ids, folder_name) => {
    try {
        // 1. 폴더 생성
        const [folderResult] = await pool.query(
            'INSERT INTO folder (name, created_by_user) VALUES (?, ?)', 
            [folder_name, userId]
        );

        const folderId = folderResult.insertId;

        // 2. 폴더에 제품 추가
        for (const productId of product_ids) {
            await pool.query(
                'INSERT INTO cart_folder_product (folder_id, product_id) VALUES (?, ?)', 
                [folderId, productId]
            );
        }

        // 3. 추가된 제품 정보와 리뷰, 하트 상태 조회
        const [products] = await pool.query(
            `SELECT 
                p.id AS product_id, 
                p.name, 
                p.en_price, 
                p.won_price, 
                p.image,
                COALESCE(AVG(r.rating), 0) AS average_rating,
                COALESCE(COUNT(r.id), 0) AS review_count,
                EXISTS(SELECT 1 FROM user_heart uh WHERE uh.user_id = ? AND uh.product_id = p.id) AS heart
             FROM product p
             JOIN cart_folder_product cfp ON p.id = cfp.product_id
             LEFT JOIN review r ON p.id = r.product_id
             WHERE cfp.folder_id = ?
             GROUP BY p.id`,
            [userId, folderId]
        );

        // 0.5 단위로 반올림하는 함수
        const roundToNearestHalf = (num) => {
            return Math.round(num * 2) / 2;
        };

        // 평균 평점을 0.5 단위로 반올림
        const roundedProducts = products.map(product => ({
            ...product,
            average_rating: roundToNearestHalf(product.average_rating),
            heart: product.heart === 1 // heart가 1이면 true, 아니면 false로 변환
        }));

        return {
            message: 'Folder created successfully',
            data: {
                folderId,
                folder_name,
                products: roundedProducts
            }
        };
    } catch (error) {
        console.error('Error creating folder', error);
        throw error;
    }
};


export const getProductsInCart = async (userId) => {
    try {
        // 1단계: 사용자의 장바구니 조회
        const [cart] = await pool.query('SELECT * FROM cart WHERE user_id = ?', [userId]);

        if (cart.length === 0) {
            return { count: 0, products: [] };
        }

        const cartId = cart[0].id;

        // 2단계: 장바구니의 제품과 해당 제품의 평균 평점, 리뷰 개수, heart 상태 조회
        const [products] = await pool.query(
            `SELECT p.id AS product_id, p.name, p.en_price, p.won_price, p.image,
                    COALESCE(AVG(r.rating), 0) AS average_rating,
                    COALESCE(COUNT(r.id), 0) AS review_count,
                    EXISTS (
                        SELECT 1 
                        FROM user_heart uh 
                        WHERE uh.user_id = ? AND uh.product_id = p.id
                    ) AS heart
             FROM product p
             JOIN cart_folder_product cfp ON p.id = cfp.product_id
             JOIN folder f ON cfp.folder_id = f.id
             LEFT JOIN review r ON p.id = r.product_id
             WHERE f.cart_id = ?
             GROUP BY p.id`,
            [userId, cartId]
        );

        // 0.5 단위로 반올림하는 함수
        const roundToNearestHalf = (num) => {
            return Math.round(num * 2) / 2;
        };

        // 평균 평점을 0.5 단위로 반올림하고 결과 반환
        const roundedProducts = products.map(product => ({
            ...product,
            average_rating: roundToNearestHalf(product.average_rating),
            heart: product.heart === 1 // heart 상태를 Boolean으로 변환
        }));

        return {
            count: roundedProducts.length,
            products: roundedProducts
        };
    } catch (error) {
        console.error('장바구니에서 제품을 조회하는 중 오류 발생', error);
        throw error;
    }
};




// 유저가 생성한 폴더 조회 서비스
export const getUserCreatedFolders = async (userId) => {
    try {
        const [folders] = await pool.query('SELECT * FROM folder WHERE created_by_user = ?', [userId]);

        if (folders.length === 0) {
            return { count: 0, folders: [] };
        }

        const foldersWithProducts = await Promise.all(folders.map(async folder => {
            const [productRows] = await pool.query(
                `SELECT p.image
                 FROM product p
                 JOIN cart_folder_product cfp ON p.id = cfp.product_id
                 WHERE cfp.folder_id = ?
                 ORDER BY p.id DESC
                 LIMIT 3`,  // 최신 이미지 3개까지 선택
                [folder.id]
            );

            const images = productRows.map(row => row.image);

            const [[{ productCount }]] = await pool.query(
                `SELECT COUNT(*) AS productCount
                 FROM cart_folder_product cfp
                 WHERE cfp.folder_id = ?`,
                [folder.id]
            );
            
            return {
                folder_id: folder.id,
                folder_name: folder.name,
                images: images,
                product_count: productCount
            };
        }));

        return {
                count: foldersWithProducts.length,
                folders: foldersWithProducts
            
        };
    } catch (error) {
        console.error('Error retrieving user-created folders', error);
        throw error;
    }
};


// 폴더 이름 변경 서비스
export const updateFolderNameInDb = async (userId, folderId, newFolderName) => {
    try {
        const [result] = await pool.query(
            `UPDATE folder
             SET name = ?
             WHERE id = ? AND created_by_user = ?`,
            [newFolderName, folderId, userId]
        );

        return result;
    } catch (error) {
        console.error('Error updating folder name', error);
        throw error;
    }
};

// 폴더 삭제 서비스
export const deleteFoldersFromDb = async (userId, folderIds) => {
    try {
        // 폴더 삭제
        const [result] = await pool.query(
            `DELETE FROM folder
             WHERE id IN (?) AND created_by_user = ?`,
            [folderIds, userId]
        );

        // 삭제된 폴더 ID를 포함한 결과 반환
        return {
            deleted_folder_ids: folderIds // 삭제한 폴더 ID 목록
        };
    } catch (error) {
        console.error('Error deleting folders', error);
        throw error;
    }
};

export const getProductsInFolderFromDb = async (folderId, userId) => {
    try {
        // 제품과 해당 제품의 평균 평점 및 리뷰 개수 조회, 하트 상태도 포함
        const [products] = await pool.query(
            `SELECT p.id AS product_id, 
                    p.name, 
                    p.en_price, 
                    p.won_price, 
                    p.image,
                    COALESCE(AVG(r.rating), 0) AS average_rating,
                    COALESCE(COUNT(r.id), 0) AS review_count,
                    EXISTS(
                        SELECT 1 
                        FROM user_heart uh 
                        WHERE uh.user_id = ? 
                        AND uh.product_id = p.id
                    ) AS heart
             FROM product p
             JOIN cart_folder_product cfp ON p.id = cfp.product_id
             LEFT JOIN review r ON p.id = r.product_id
             WHERE cfp.folder_id = ?
             GROUP BY p.id`,
            [userId, folderId]
        );

        // 0.5 단위로 반올림하는 함수
        const roundToNearestHalf = (num) => {
            return Math.round(num * 2) / 2;
        };

        // 평균 평점을 0.5 단위로 반올림
        const roundedProducts = products.map(product => ({
            ...product,
            average_rating: roundToNearestHalf(product.average_rating),
            heart: product.heart === 1 // 하트 상태를 boolean으로 변환
        }));

        return {
            count: roundedProducts.length,
            products: roundedProducts
        };
    } catch (error) {
        console.error('Error retrieving products in folder', error);
        throw error;
    }
};



// 폴더 내 상품 삭제 서비스
export const deleteProductsFromFolder = async (folderId, productIds) => {
    try {
        if (!Array.isArray(productIds) || productIds.length === 0) {
            throw new Error('productIds must be a non-empty array');
        }

        const placeholders = productIds.map(() => '?').join(',');
        const query = 
            `DELETE FROM cart_folder_product
             WHERE folder_id = ? AND product_id IN (${placeholders})`;
        
        await pool.query(query, [folderId, ...productIds]);
        
        return {
            message: 'Products deleted successfully',
        };
    } catch (error) {
        console.error('Error deleting products from folder', error);
        throw error;
    }
};