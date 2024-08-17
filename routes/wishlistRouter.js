import { Router } from 'express';
import { getWishlist, createFolder, getUserFolders, updateFolderName, deleteFolders } from '../controller/wishlistController.js';

const router = Router();

router.get('/', getWishlist); // 장바구니의 제품 목록 조회
router.get('/user-folders', getUserFolders); // GET 요청을 처리하는 라우트
router.post('/create-folder', createFolder); // POST 요청을 처리하는 라우트
router.post('/update-folder', updateFolderName); // 폴더 이름 변경을 위한 POST 요청
router.post('/delete-folders', deleteFolders);  // 다중 폴더 삭제

export default router;
