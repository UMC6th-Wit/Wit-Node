import express from 'express';
import passport from 'passport';
import { response } from '../config/response.js';
import { successStatus } from '../config/successStatus.js';
import { getHome,getProductByCategoryID,getNyamRecommend,getRecommend } from '../services/homeService.js';
import {
    decodeAccessToken,
  } from '../middleware/jwtMiddleware.js';

const homeRouter = express.Router();


// 카테고리 추천
homeRouter.get('/', decodeAccessToken,async (req, res) => {
    //main_cateogryID와 cateogry를 통해 가져올 count
    const { count } = req.query;
    console.log(count)
            //유저 정보 가져오는 로직 추가해애함.
    const { userId } = req;


    try {
        const homeMainResponse = await getHome(count,userId);
        res.send(response(successStatus.HOME_SUCCESS, homeMainResponse));
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
homeRouter.get('/category', decodeAccessToken,async (req, res) => {
    //main_cateogryID와 cateogry를 통해 가져올 count
    const { category, count } = req.query;
    console.log(category,count)
            //유저 정보 가져오는 로직 추가해애함.
            const { userId } = req;
    
    try {
        const homeMainResponse = await getProductByCategoryID(category,count,userId);
        res.send(response(successStatus.HOME_SUCCESS, homeMainResponse));
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
homeRouter.get('/nyam',decodeAccessToken, async (req, res) => {
    try {
        const { count } = req.query;
                //유저 정보 가져오는 로직 추가해애함.
                const { userId } = req;
        const homeMainResponse = await getNyamRecommend(count,userId);
        res.send(response(successStatus.HOME_SUCCESS, homeMainResponse));
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
homeRouter.get('/recommend',decodeAccessToken, async (req, res) => {
    try {
        const { count } = req.query;
                //유저 정보 가져오는 로직 추가해애함.
                const { userId } = req;
        const homeMainResponse = await getRecommend(count,userId);
        res.send(response(successStatus.HOME_SUCCESS, homeMainResponse));
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
export default homeRouter;