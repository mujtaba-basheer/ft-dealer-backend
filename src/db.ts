import { createPool } from "mysql2";
import { config } from "dotenv";
config();

// creating db connection
const pool = createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("error", (err) => {
  console.error(err);
});

pool.getConnection((err, connection) => {
  if (err) {
    console.log("Error connecting to database...");
    console.error(err);
  } else {
    console.log("Database connected successfully");
    connection.release();
  }
});

const heartbeat = setInterval(() => {
  pool.query(`SELECT 1;`, (err, result) => {
    if (err) {
      console.error(err);
      clearInterval(heartbeat);
    }
  });
}, 1000);

export default pool;
