import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

app.set('port', process.env.PORT || 3000);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function testDatabaseConnection() {
  try {
    const [rows] = await pool.query('show databases');
    console.log('Database connection test:', [rows]);
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

testDatabaseConnection();

app.listen(app.get('port'), () => {
  console.log(`Example app listening on port ${app.get('port')}`);
});
