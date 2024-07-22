import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const databaseConfig = {
  host:
    process.env.DB_HOST ||
    'wit-database-1.chcygck0gruw.ap-northeast-2.rds.amazonaws.com',
  user: process.env.DB_USER || 'root',
  port: parseInt(process.env.DB_PORT || 3306),
  database: process.env.DB_TABLE || 'wit',
  password: process.env.DB_PASSWORD || '12345678',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(databaseConfig);

// db 연결 확인 함수

// async function checkDBConnect() {
//   try {
//     const [rows, fields] = await pool.query('Show tables');
//     console.log(rows);
//   } catch (err) {
//     console.error(err);
//   }
// }

// checkDBConnect();
