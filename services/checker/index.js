const domainChecker = require("./domainServices");
const sslChecker = require("./sslServices");

module.exports = {
  domainChecker: (domain) => (domainChecker.getInformationDomain(domain)),
  sslChecker: (domain, port) => (sslChecker.getSSLStatus(domain, port)),
};
