import { pool } from '../config/db-config.js';

// 폴더 생성 서비스
// 새로운 폴더 생성 및 제품 추가
export const createFolderWithProducts = async (userId, product_ids, folder_name) => {
    try {
        // 새로운 폴더 생성
        const [folderResult] = await pool.query(
            'INSERT INTO folder (name, created_by_user) VALUES (?, ?)', 
            [folder_name, userId]
        );

        const folderId = folderResult.insertId;

        // 선택한 제품들을 폴더에 추가
        for (const productId of product_ids) {
            await pool.query(
                'INSERT INTO cart_folder_product (folder_id, product_id) VALUES (?, ?)', 
                [folderId, productId]
            );
        }

        // 생성된 폴더와 제품들 반환
        const [products] = await pool.query(`
            SELECT p.id AS product_id, p.name, p.en_price, p.won_price, p.image, p.manufacturing_country
            FROM product p
            JOIN cart_folder_product cfp ON p.id = cfp.product_id
            WHERE cfp.folder_id = ?
        `, [folderId]);

        return {
            message: 'Folder created successfully',
            data: {
                folderId,
                folder_name,
                products
            }
        };
    } catch (error) {
        console.error('Error creating folder', error);
        throw error;
    }
};
// 장바구니에서 제품 조회 서비스
export const getProductsInCart = async (userId) => {
    try {
        // 유저의 장바구니 가져오기
        let [cart] = await pool.query('SELECT * FROM cart WHERE user_id = ?', [userId]);

        if (cart.length === 0) {
            return { count: 0, products: [] };  // 장바구니가 비어있는 경우 빈 배열과 count 0 반환
        }

        const cartId = cart[0].id;

        // 폴더에 포함된 제품 목록 가져오기
        const [products] = await pool.query(`
            SELECT p.id AS product_id, p.name, p.en_price, p.won_price, p.image, p.manufacturing_country
            FROM product p
            JOIN cart_folder_product cfp ON p.id = cfp.product_id
            JOIN folder f ON cfp.folder_id = f.id
            WHERE f.cart_id = ?
            GROUP BY p.id
        `, [cartId]);

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

// 유저가 생성한 폴더와 그 안의 제품 목록 조회
// 사용자가 'create-folder'를 통해 생성한 폴더를 가져오는 함수
export const getUserCreatedFolders = async (userId) => {
    try {
        // 사용자가 생성한 폴더만 가져오기
        let [folders] = await pool.query('SELECT * FROM folder WHERE created_by_user = ?', [userId]);

        if (folders.length === 0) {
            return { count: 0, folders: [] };
        }

        // 각 폴더에 포함된 제품 목록 가져오기
        const foldersWithProducts = await Promise.all(folders.map(async folder => {
            const [products] = await pool.query(`
                SELECT p.id AS product_id, p.name, p.en_price, p.won_price, p.image, p.manufacturing_country
                FROM product p
                JOIN cart_folder_product cfp ON p.id = cfp.product_id
                WHERE cfp.folder_id = ?
            `, [folder.id]);

            return {
                folder_id: folder.id,
                folder_name: folder.name,
                products
            };
        }));

        const count = foldersWithProducts.length;

        return {
            count,
            folders: foldersWithProducts
        };
    } catch (error) {
        console.error('Error retrieving user-created folders', error);
        throw error;
    }
};

// 폴더 이름을 변경하는 함수
export const updateFolderNameInDb = async (userId, folderId, newFolderName) => {
    try {
        // 폴더 이름을 업데이트하는 SQL 쿼리
        const [result] = await pool.query(`
            UPDATE folder
            SET name = ?
            WHERE id = ? AND created_by_user = ?
        `, [newFolderName, folderId, userId]);

        return result;
    } catch (error) {
        console.error('Error updating folder name', error);
        throw error;
    }
};

export const deleteFoldersFromDb = async (userId, folderIds) => {
    try {
        // 다중 폴더 삭제를 위한 SQL 쿼리
        const [result] = await pool.query(`
            DELETE FROM folder
            WHERE id IN (?) AND created_by_user = ?
        `, [folderIds, userId]);

        return result;
    } catch (error) {
        console.error('Error deleting folders', error);
        throw error;
    }
};