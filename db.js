const config = require("./config").db;
const mysql = require("mysql");
// mysql链接
const pool = mysql.createPool({
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database,
  port: config.port,
  connectionLimit: 10
});

module.exports = {
  query: async (sql, values) => {
    return new Promise((resolve, reject) => {
      pool.query(sql, values, function(err, results) {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
};
