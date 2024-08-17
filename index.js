import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cartRouter from './routes/cartRouter.js'
import mypageRouter from './routes/mypageRouter.js'
import SwaggerUi from 'swagger-ui-express';

dotenv.config();

const app = express();

app.set('port', process.env.PORT || 3000);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/mypage', mypageRouter);
app.use('/api/product', cartRouter);
// app.use('/api-docs', SwaggerUi.serve, SwaggerUi.setup(specs));

app.listen(app.get('port'), () => {
  console.log(`Example app listening on port ${app.get('port')}`);
});
