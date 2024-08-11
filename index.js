import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { pool } from './config/db-config.js';
import passport from 'passport';
import session from 'express-session';
import SwaggerUi from 'swagger-ui-express';
import { responseMiddleware } from './config/response-middleware.js'; //응답 미들웨어 불러오기
import noticesRouter from './routes/notices.js';
import searchesRouter from './routes/searches.js';
import usersRouter from './routes/users.js'; 


import { userRouter } from './routes/user.js';
import { passportConfig } from './config/passportConfig.js';

dotenv.config();

const app = express();

app.set('port', process.env.PORT || 3000);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// 기본 응답 셋팅 미들웨어 사용
app.use(responseMiddleware);

app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Passport 설정
passportConfig();

app.use('/api/users', userRouter);

// app.use('/api-docs', SwaggerUi.serve, SwaggerUi.setup(specs));

// 기본 라우트 설정
app.get('/', (req,res) => {
  res.success('ISSUCCESS',null);
})

app.listen(app.get('port'), () => {
  console.log(`Example app listening on port ${app.get('port')}`);
});

app.use('/notices',noticesRouter); //공지사항 라우트 설정 
app.use('/searches', searchesRouter);
app.use('/users', usersRouter);

(async () => { //DB랑 연결 성공했는지 확인해보는 코드 
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database');
    connection.release();
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
})();