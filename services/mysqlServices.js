const mysql = require("mysql");

const host = process.env.DBHOST;
const user = process.env.DBUSER;
const password = process.env.DBPASSWORD;
const database = process.env.DBNAME;

const pool = mysql.createPool({ host, user, password, database });

const createConnection = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) reject(err);
      resolve(connection);
    });
  });
};

const raw = async (conn, strQuery, escapeValue) => {
  return new Promise(async (resolve, reject) => {
    conn.query(strQuery, escapeValue, (err, result) => {
      conn.release();
      if (err) reject(err);
      resolve(result);
    });
  });
};

exports.checkAvailableSslDomain = async (domain) => {
  const conn = await createConnection();
  const sqlString = "SELECT domain FROM ssl_domain WHERE domain = ?";
  const escapeVal = [domain];
  const sslDomains = await raw(conn, sqlString, escapeVal);
  if (sslDomains.length >= 1) return "MYSQL_SSL_DOMAIN_AVAILABLE";
};

exports.insertIntoSslDomain = async (nama, domain, port, tempat) => {
  const conn = await createConnection();
  const sqlString =
    "INSERT INTO ssl_domain (nama, domain, port, tempat) VALUES ?";
  const escapeVal = [[[nama, domain, port, tempat]]];
  const addedSslDomain = await raw(conn, sqlString, escapeVal);
  if (!addedSslDomain) {
    throw new Error("MYSQL_INSERT_SSL_DOMAIN_FAILED");
  }
};

exports.readAllSslDomain = async () => {
  const conn = await createConnection();
  const sqlString = "SELECT * FROM ssl_domain";
  const sslDomains = await raw(conn, sqlString);
  if (!sslDomains) {
    throw new Error("MYSQL_DOMAIN_SSL_NOT_FOUND");
  }
  return sslDomains;
};

exports.readAllDomain = async () => {
  const conn = await createConnection();
  const sqlString = "SELECT * FROM main_domain";
  const domains = await raw(conn, sqlString);
  if (!domains) {
    throw new Error("MYSQL_DOMAIN_NOT_FOUND");
  }
  return domains;
};

exports.checkAvailableMainDomain = async (domain) => {
  const conn = await createConnection();
  const sqlString = "SELECT domain FROM main_domain WHERE domain = ?";
  const escapeVal = [domain];
  const domains = await raw(conn, sqlString, escapeVal);
  if (domains.length >= 1) return "MYSQL_MAIN_DOMAIN_AVAILABLE";
};

exports.insertIntoMainDomain = async (hosting, domain) => {
  const conn = await createConnection();
  const sqlString = "INSERT INTO main_domain (hosting, domain) VALUES ?";
  const escapeVal = [[[hosting, domain]]];
  const addedDomain = await raw(conn, sqlString, escapeVal);
  if (!addedDomain) {
    throw new Error("MYSQL_INSERT_MAIN_DOMAIN_FAILED");
  }
};
