const checkerServices = require("./checkerServices");
const mysqlServices = require("./mysqlServices");
const senderServices = require("./senderServices");
const { formatDate } = require("../utils/dateUtils");

exports.monitoringSSLExpired = async (warnDays, botToken, chatId, title) => {
  const sslDomains = await mysqlServices.readAllSslDomain();
  const sslCheckerResults = await Promise.allSettled(sslDomains.map(async (ssl) => {
    const sslStatus = await checkerServices.getSSLStatus(ssl.domain, ssl.port);
    if (sslStatus.remaining <= warnDays) {
      const newExpired = formatDate(sslStatus.expired);
      return {
        nama: ssl.nama,
        domain: ssl.domain,
        remaining: sslStatus.remaining,
        status: sslStatus.status,
        expired: newExpired,
        tempat: ssl.tempat,
      };
    }
    return false;
  }));
  console.log(sslCheckerResults);
  const listSslFailedCheck = sslCheckerResults.filter((result) => result.status === "rejected");
  if (listSslFailedCheck.length) {
    await senderServices.sendErrorSSLMessage(botToken, chatId, listSslFailedCheck, "SSL ERROR CHECK");
  }
  const listSslWarning = sslCheckerResults.filter((result) => result?.value?.remaining <= warnDays);
  if (!listSslWarning.length) return;
  return await senderServices.sendWarningMessage(botToken, chatId, listSslWarning, title);
};

exports.monitoringDomainExpired = async (warnDays, botToken, chatId, title) => {
  const domains = await mysqlServices.readAllDomain();
  const domainCheckResults = await Promise.allSettled(domains.map(async (list) => {
    const checkDomain = await checkerServices.getInformationDomain(list.domain);
    if (checkDomain.remaining <= warnDays) {
      const newExpired = formatDate(checkDomain.expired);
      return {
        hosting: list.hosting,
        remaining: checkDomain.remaining,
        domain: list.domain,
        expired: newExpired,
      }
    }
    return false;
  }));
  console.log(domainCheckResults);
  const listDomainFailedCheck = domainCheckResults.filter((result) => result.status === "rejected");
  if (listDomainFailedCheck.length) {
    await senderServices.sendErrorDomainMessage(botToken, chatId, listDomainFailedCheck, "DOMAIN ERROR CHECK");
  }
  const listDomainWarning = domainCheckResults.filter((result) => result?.value?.remaining <= warnDays);
  if (!listDomainWarning.length) return;
  await senderServices.sendWarningDomainMessage(botToken, chatId, listDomainWarning, title);
};
