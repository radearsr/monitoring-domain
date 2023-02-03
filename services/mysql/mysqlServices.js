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
  return result;
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

exports.updateSslExpired = async (domain, expired) => {
  const connection = await connectionDB();
  const result = await queryDB(
    connection,
    "UPDATE ssl_domain SET expired = ? WHERE domain = ?",
    [expired, domain],
  );
  console.log(`[${formatDate(dateNow)}]`, mysql.format(
    "UPDATE ssl_domain SET expired = ? WHERE domain = ?",
    [expired, domain],
  ));
  return result;
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
  return result;
};

exports.updateExpiredMainDomain = async (expired, domain) => {
  const expiredOn = new Date(expired).toISOString();
  const connection = await connectionDB();
  const result = await queryDB(
    connection,
    "UPDATE main_domain SET expired=? WHERE domain=?",
    [expiredOn, domain],
  );
  console.log(`[${formatDate(dateNow)}]`, mysql.format(
    "UPDATE main_domain SET expired=? WHERE domain=?",
    [expiredOn, domain],   
  ));
  return result;
};
