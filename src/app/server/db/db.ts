import mysql from 'mysql2/promise';


// Database connection function
export const getDbConnection = async () => {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "temple_app",
  });
};
