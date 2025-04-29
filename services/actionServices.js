const mysqlServices = require("./mysqlServices");
const checker = require("./checkerServices");
const { MESSAGE_REPLY } = require("../utils/replyMessageUtils");

const createNewDomain = async (hosting, domain) => {
  const availableDomain = await mysqlServices.checkAvailableMainDomain(domain);
  if (availableDomain !== "MYSQL_MAIN_DOMAIN_AVAILABLE") {
    await mysqlServices.insertIntoMainDomain(hosting, domain);
  }
  const resultChecker = await checker.getInformationDomain(domain);
  return MESSAGE_REPLY.DOMAIN_ADD_SUCCESS(domain, resultChecker.expires_on);
};

const createNewSslDomain = async (name, domain, port, tempat) => {
  const availableSslDomain = await mysqlServices.checkAvailableSslDomain(
    domain
  );
  if (availableSslDomain !== "MYSQL_SSL_DOMAIN_AVAILABLE") {
    await mysqlServices.insertIntoSslDomain(name, domain, port, tempat);
  }
  const resultChecker = await checker.getSSLStatus(domain, port);
  return MESSAGE_REPLY.SSL_ADD_SUCCESS(domain, port, resultChecker.expired);
};

exports.sslAction = async text => {
  try {
    console.log(text);
    const [, action, name, domain, port, tempat] = text.split("#") || "";
    switch (action) {
      case "ADD":
        return await createNewSslDomain(name, domain, port, tempat);
      default:
        return MESSAGE_REPLY.ACTION_NOT_FOUND;
    }
  } catch (error) {
    switch (error.message) {
      case "MYSQL_INSERT_MAIN_DOMAIN_FAILED":
        return MESSAGE_REPLY.DOMAIN_ADD_FAILED;
      default:
        return MESSAGE_REPLY.GENERAL_ERROR;
    }
  }
};

exports.domainAction = async text => {
  try {
    const [, action, hosting, domain] = text.split("#") || "";
    switch (action) {
      case "ADD":
        return await createNewDomain(hosting, domain);
      default:
        return MESSAGE_REPLY.ACTION_NOT_FOUND;
    }
  } catch (error) {
    if (error.message.includes("&-&")) {
      const [domain, message] = error.message.split("&-&");
      console.log(domain, message);
      return MESSAGE_REPLY.DOMAIN_FAILED_RESPONSE(domain, message);
    }
    switch (error.message) {
      case "MYSQL_INSERT_MAIN_DOMAIN_FAILED":
        return MESSAGE_REPLY.DOMAIN_ADD_FAILED;
      default:
        return MESSAGE_REPLY.GENERAL_ERROR;
    }
  }
};
