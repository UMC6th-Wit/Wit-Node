import express from "express";



import { getAllNotices } from "../models/noticeDao.js";
import { getPopularProductsByCategory,getALLProductByALLCategory,getNyamRecommendByUser } from '../models/productDao.js';
import {getOneUser} from '../models/userDao.js';

export const getHome = async (count,userId) => {
    try {
       console.log("asdasdasd")
       console.log(count)
       
       
        //get userId logic
        //get products By userId
        //get  notice
       


       // 카테고리별 인기 상품 가져오기
       const userInfo = await getOneUser(userId);
       
       // 유저에 대한 추천 상품 가져오기
       const RecommendForUserResponse = await getCustomProductsByUserId(userId);

       // 카테고리별 인기 상품 가져오기
       const PopularProductsResponse = await getALLProductByALLCategory(count);

       // 식품 추천 상품 가져오기
       const nyamProductsResponse = await getNyamRecommendByUser(count);

       // 공지사항 가져오기
       const noticeResponse = await getAllNotices();
        // 메인 홈 응답 구성
        return { 
                // recommendations: RecommendForUserResponse,
                // popularProducts: PopularProductsResponse,
                // nyamRecommendations: NyamRecommendProductsResponse,
                // notices: noticeResponse
            user : userInfo,
            recommendations: nyamProductsResponse,
            popularProducts: PopularProductsResponse,
            nyamRecommendations: nyamProductsResponse,
            notices: noticeResponse
            
        };

    } catch (error) {
        console.error('Failed to update home', error);

    }

}

export const getProductByCategoryID = async (category, count, userId, cursor) => {
    try {
        console.log("Fetching products for category:", category, "with count:", count, "and cursor:", cursor);

        // 유저 정보 가져오는 로직 (예시로 빈 객체를 반환)
        const userInfo = await getOneUser(userId); // 실제 유저 정보 가져오는 로직을 추가할 수 있습니다.

        // 카테고리별 인기 상품 가져오기
        const { groupedProducts, cursor: newCursor } = await getPopularProductsByCategory(category, count, cursor);

        // 메인 홈 응답 구성
        return {
            user: userInfo,
            groupedProducts, // 카테고리별로 그룹화된 인기 상품
            cursor: newCursor // 다음 페이지로의 커서 정보
        };

    } catch (error) {
        console.error('Failed to fetch products by category', error);
        throw new Error('Internal Server Error');
    }
};





const getCustomProductsByUserId = async(userId) =>{
    try {
        
    } catch (error) {
        
    }

}

export const getNyamRecommend = async(count,userId)=>{
    try{
           

        console.log(userId)
           // 카테고리별 인기 상품 가져오기
           const userInfo = await getOneUser(userId);
           console.log(userInfo)
        // 냠냠  인기 상품 가져오기
       const nyamProductsResponse = await getNyamRecommendByUser(count);

        // 메인 홈 응답 구성
        return { 
            user : userInfo,

            nyamRecommendations: nyamProductsResponse,            
        };

    }catch{

    }
}

export const getRecommend = async(count,userId)=>{
    try{

        console.log(userId)
       // 카테고리별 인기 상품 가져오기
       const userInfo = await getOneUser(userId);
       // 냠냠  인기 상품 가져오기
       const nyamProductsResponse = await getNyamRecommendByUser(count);
        
        // 메인 홈 응답 구성
        return { 
            user : userInfo,
            recommendations: nyamProductsResponse,            
        };

    }catch{

    }
}