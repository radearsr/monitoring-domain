require("dotenv").config();
const Cron = require("croner");
const checkerServices = require("./services/checker/checkerServices");
const mysqlServices = require("./services/mysql/mysqlServices");
const teleServices = require("./services/telegram/telegramService");
const { formatDate } = require("./utils/DateService");

const BOT_TOKEN = process.env.NODE_ENV === "production" ? process.env.BOT_TOKEN : process.env.BOT_TOKEN_DEV;   
const WARN_DAYS = process.env.NODE_ENV === "production" ? 300 : 7;
const SEND_TO_ID = process.env.NODE_ENV === "production" ? process.env.ID_GROUP_MONIT_SERVER : process.env.ID_MY;

const monitoringSSLExpired = async () => {
  /**
   * * Read all data ssl domain from database
  */
  const resultSSLDomains = await mysqlServices.readAllSslDomain();
  /**
   * * Result variable is check remaining days all ssl domain with live checking
  */
  const liveSSLChecker = await Promise.all(resultSSLDomains.map(async (result) => {
    const sslStatus = await checkerServices.getSSLStatus(result.domain, result.port);
    const newExpired = formatDate(sslStatus.expired);
    if (sslStatus.remaining <= WARN_DAYS) {
      return {
        nama: result.nama,
        domain: result.domain,
        remaining: sslStatus.remaining,
        status: sslStatus.status,
        expired: newExpired,
        tempat: result.tempat,
      };
    }
    return false;
  }));
  const filteredChecker = liveSSLChecker.filter((result) => result !== false);
  /**
   * * Filtering data from live checker, get data ssl when remaining < WARN_DAYS
  */
  if (filteredChecker.length >= 1) {
    const filterWarningSSL = filteredChecker.filter((result) => result.remaining <= WARN_DAYS);
    if (filterWarningSSL.length > 0) {
      return await teleServices.sendWarningMessage(BOT_TOKEN, SEND_TO_ID, filterWarningSSL);
    }
  }
};

const monitoringDomainExpired = async () => {
  /**
   * * Read all data domain from database
  */
  const results = await mysqlServices.readAllDomain();
  /**
   * * Result variable is check remaining days all domain with live checking
  */
  const liveChecker = await Promise.all(results.map(async (result) => {
    const today = new Date().getTime();
    const checkDomain = await checkerServices.getInformationDomain(result.domain);
    const dateOfDomain = new Date(checkDomain.expires_on).getTime();
    const remainingTime = dateOfDomain - today;
    const remainingDays = Math.round(remainingTime / (1000 * 60 * 60 * 24));
    const newFormatDateDomain = formatDate(new Date(dateOfDomain).toISOString());
    if (remainingDays <= WARN_DAYS) {
      return {
        hosting: result.hosting,
        remaining: remainingDays,
        domain: result.domain,
        expired: newFormatDateDomain,
      }
    }
    return false;
  }));
  const filteredChecker = liveChecker.filter((result) => result !== false);
  /**
   * * Filtering data from live checker, get data domain when remaining < WARN_DAYS
  */
  if (filteredChecker.length >= 1) {
    const filteredData = liveChecker.filter((result) => result.remaining <= WARN_DAYS);
    if (filteredData.length > 0) {
      await teleServices.sendWarningDomainMessage(BOT_TOKEN, SEND_TO_ID, filteredData);
    }
  }
};

Cron("0 0 7 * * *", { timezone: "Asia/Jakarta" }, async () => {
  await teleServices.sendSelfAlert(BOT_TOKEN, process.env.ID_MY, "Cron Running Gaiss...");
  monitoringSSLExpired();
  monitoringDomainExpired();
});
