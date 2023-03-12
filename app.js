require("dotenv").config();
const cron = require("node-cron");
const { Telegraf } = require("telegraf");
const checkerServices = require("./services/checker/checkerServices");
const mysqlServices = require("./services/mysql/mysqlServices");
const teleServices = require("./services/telegram/telegramService");
const { formatDate } = require("./utils/DateService");
const sslChecker = require("ssl-checker");
const native = require("./native");

const BOT_TOKEN = process.env.NODE_ENV === "production" ? process.env.BOT_TOKEN : process.env.BOT_TOKEN_DEV;   
const WARN_DAYS = process.env.NODE_ENV === "production" ? 7 : 300;
const SEND_TO_ID = process.env.NODE_ENV === "production" ? process.env.ID_GROUP_MONIT_SERVER : process.env.ID_MY;

console.log({ BOT_TOKEN, WARN_DAYS, SEND_TO_ID });
const bot = new Telegraf(BOT_TOKEN);

bot.command("start", async (ctx) => {
  const result = await checkerServices.getSSLStatus("pm2.keymetrics.io");
  console.log(result);
  ctx.telegram.sendMessage(ctx.chat.id, `Hello I'm IT Support BOT :)\n${BOT_TOKEN}\n${SEND_TO_ID}`);
});

bot.command("format", async (ctx) => {
  ctx.telegram.sendMessage(ctx.chat.id, ">>>>> Format Aksi BOT <<<<<\n\n** Tambah Monitoring SSL **\n/ssl#Aksi#Nama#Domain#Port#Tempat\nContoh\n/ssl#Tambah#Web Report PMK#report.serverpmk.com#443#10.5.7.208\n\n** Tambah Monitoring Domain **\n/domain#Aksi#Hosting#Domain\nContoh\n/domain#Tambah#Niagahoster#unitedtronik.co.id");
})

bot.command("ssl", async (ctx) => {
  const { text: msg } = ctx.message;  
  const [,
    action,
    nama,
    domain,
    port,
    tempat,
  ] = msg.split("#") || "";
  try {

    if (action === "Tambah") {
      await mysqlServices.checkAvailableSslDomain(domain);
      await mysqlServices.insertIntoSslDomain(nama, domain, port, tempat);
      await ctx.telegram.sendMessage(ctx.chat.id, "Berhasil Menambahkan Domain Cek SSL Baru");
      // const sslStatus = await checkerServices.getSSLStatus(domain, port);
      const sslStatus = await native.getSSLCertificateInfo(domain);
      await ctx.telegram.sendMessage(ctx.chat.id, `SSL Expired ${formatDate(sslStatus.validTo)}`);
    }
  } catch (error) {
    switch (error.message) {
      case "SSL_DOMAIN_AVAILABLE":
        ctx.telegram.sendMessage(ctx.chat.id, "SSL Domain Sudah Tersedia");
        // const sslStatus = await sslChecker(domain, { method: "GET", port });
        const sslStatus = await native.getSSLCertificateInfo(domain);
        ctx.telegram.sendMessage(ctx.chat.id, `SSL Expired ${formatDate(sslStatus.validTo)}`);
        break;
      case "INSERT_SSL_DOMAIN_FAILED":
        ctx.telegram.sendMessage(ctx.chat.id, "Gagal Menambahkan SSL Domain");
        break;
      default:
        console.log(error);
        ctx.telegram.sendMessage(ctx.chat.id, "Terjadi Kegagalan Saat Aksi /ssl");
        break;
    }   
  }
});

bot.command("domain", async (ctx) => {
  const { text: msg } = ctx.message;
  const [,
    action,
    hosting,
    domain,
  ] = msg.split("#") || "";
  try {
    if (action === "Tambah") {
      await mysqlServices.checkAvailableMainDomain(domain);
      await mysqlServices.insertIntoMainDomain(hosting, domain);
      await ctx.telegram.sendMessage(ctx.chat.id, "Berhasil Menambahkan Domain Baru")
      const domainExpired = await checkerServices.getInformationDomain(domain);
      await ctx.telegram.sendMessage(ctx.chat.id, `Domain Expired ${domainExpired.expires_on}`);
    }
  } catch (error) {
    switch (error.message) {
      case "MAIN_DOMAIN_AVAILABLE":
        ctx.telegram.sendMessage(ctx.chat.id, "Domain Sudah Tersedia");
        const domainExpired = await checkerServices.getInformationDomain(domain);
        await ctx.telegram.sendMessage(ctx.chat.id, `Domain Expired ${domainExpired.expires_on}`);
        break;
      case "INSERT_MAIN_DOMAIN_FAILED":
        ctx.telegram.sendMessage(ctx.chat.id, "Gagal Menambahkan Domain");
        break;
      default:
        console.log(error);
        ctx.telegram.sendMessage(ctx.chat.id, "Terjadi Kegagalan Saat Aksi /domain");
        break;
    }
  }
});


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
    console.log("🚀 ~ file: app.js:108 ~ liveSSLChecker ~ sslStatus:", sslStatus)
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
      return await teleServices.sendWarningMessage(bot, SEND_TO_ID, filterWarningSSL);
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
      await teleServices.sendWarningDomainMessage(bot, SEND_TO_ID, filteredData);
    }
  }
};

cron.schedule("0 7 * * *", () => {
  monitoringSSLExpired();
  monitoringDomainExpired();
}, {
  scheduled: true,
  timezone: "Asia/Jakarta"
});

(async () => {
  const result = await checkerServices.getSSLStatus("report.serverpmk.com");
  console.log(result);
})()

bot.launch();
