"use strict";

const mysql = require("mysql");
const { formatDate } = require("../../utils/DateService");

const dateNow = new Date().toISOString();
const pool = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.DBNAME,
});

const connectionDB = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) reject(err);
      resolve(connection);
    });
  });
};

const queryDB = async (conn, strQuery, escapeValue) => {
  return new Promise(async (resolve, reject) => {
    conn.query(strQuery, escapeValue, (err, result) => {
      conn.release();
      if (err) reject(err);
      resolve(result);
    });
  });
};

exports.checkAvailableSslDomain = async (domain) => {
  const conn = await connectionDB();
  const result = await queryDB(conn, "SELECT domain FROM ssl_domain WHERE domain=?", [domain]);
  if (result.length >= 1) {
    throw new Error("SSL_DOMAIN_AVAILABLE");
  }
};

exports.insertIntoSslDomain = async (nama, domain, port, tempat) => {
  const connection = await connectionDB();
  const result = await queryDB(
    connection,
    "INSERT INTO ssl_domain (nama, domain, port, tempat) VALUES ?",
    [[[nama, domain, port, tempat]]],
  );
  console.log(`[${formatDate(dateNow)}]`, mysql.format(
    "INSERT INTO ssl_domain (nama, domain, port, tempat) VALUES ?",
    [[[nama, domain, port, tempat]]],
  ));
  if (result.affectedRows < 1) {
    throw new Error("INSERT_SSL_DOMAIN_FAILED");
  }
};
  
exports.readAllSslDomain = async () => {
  const connection = await connectionDB();
  const result = await queryDB(
    connection,
    "SELECT * FROM ssl_domain",
  );
  console.log(`[${formatDate(dateNow)}]`, mysql.format("SELECT * FROM ssl_domain"));
  return result;
};
    
exports.readAllDomain = async () => {
  const connection = await connectionDB();
  const result = await queryDB(
    connection,
    "SELECT * FROM main_domain",
  );
  console.log(`[${formatDate(dateNow)}]`, mysql.format("SELECT * FROM main_domain"));
  return result;
};
      
exports.checkAvailableMainDomain = async (domain) => {
  const conn = await connectionDB();
  const result = await queryDB(conn, "SELECT domain FROM main_domain WHERE domain=?", [domain]);
  if (result.length >= 1) {
    throw new Error("MAIN_DOMAIN_AVAILABLE");
  }
};

exports.insertIntoMainDomain = async (hosting, domain) => {
  const connection = await connectionDB();
  const result = await queryDB(
    connection,
    "INSERT INTO main_domain (hosting, domain) VALUES ?",
    [[[hosting, domain]]],
  );
  console.log(`[${formatDate(dateNow)}]`, mysql.format(
    "INSERT INTO main_domain (domain) VALUES ?",
    [[[domain]]],
  ));
  if (result.affectedRows < 1) {
    throw new Error("INSERT_MAIN_DOMAIN_FAILED");
  }
};
