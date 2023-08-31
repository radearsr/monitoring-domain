require("dotenv").config();
const Cron = require("croner");
const { Telegraf, Markup } = require("telegraf");
const checkerServices = require("./services/checkerServices");
const mysqlServices = require("./services/mysqlServices");
const teleServices = require("./services/senderServices");
const { formatDate } = require("./utils/DateService");

const BOT_TOKEN = process.env.NODE_ENV === "production" ? process.env.BOT_TOKEN : process.env.BOT_TOKEN_DEV;   
const WARN_DAYS = process.env.NODE_ENV === "production" ? 7 : 300;
const SEND_TO_ID = process.env.NODE_ENV === "production" ? process.env.ID_GROUP_MONIT_SERVER : process.env.ID_MY;

console.log({ BOT_TOKEN, WARN_DAYS, SEND_TO_ID });
const bot = new Telegraf(BOT_TOKEN);

bot.command("start", async (ctx) => {
  ctx.telegram.sendMessage(ctx.chat.id, `Hello I'm IT Support BOT :)\n${BOT_TOKEN}\n${SEND_TO_ID}`, Markup.keyboard([
    ["CEK SSL", "CEK DOMAIN"],
    ["FORMAT"],
  ]).resize());
});

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
      const sslStatus = await checkerServices.getSSLStatus(domain, port);
      await ctx.telegram.sendMessage(ctx.chat.id, `SSL Expired ${formatDate(sslStatus.expired)}`);
    }
  } catch (error) {
    switch (error.message) {
      case "SSL_DOMAIN_AVAILABLE":
        ctx.telegram.sendMessage(ctx.chat.id, "SSL Domain Sudah Tersedia");
        const sslStatus = await checkerServices.getSSLStatus(domain, port);
        ctx.telegram.sendMessage(ctx.chat.id, `SSL Expired ${formatDate(sslStatus.expired)}`);
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
      if (!domainExpired.expires_on) {
        return ctx.telegram.sendMessage(ctx.chat.id, `Link https://www.whois.com/whois/${domain}`);
      }
      await ctx.telegram.sendMessage(ctx.chat.id, `Domain Expired ${domainExpired.expires_on}`);
    }
  } catch (error) {
    switch (error.message) {
      case "MAIN_DOMAIN_AVAILABLE":
        ctx.telegram.sendMessage(ctx.chat.id, "Domain Sudah Tersedia");
        const domainExpired = await checkerServices.getInformationDomain(domain);
        if (!domainExpired.expires_on) {
          return ctx.telegram.sendMessage(ctx.chat.id, `Link https://www.whois.com/whois/${domain}`);
        }
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

const monitoringSSLExpired = async (warnDays, botToken, chatId, title) => {
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
    if (sslStatus.remaining <= warnDays) {
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
   * * Filtering data from live checker, get data ssl when remaining < warnDays
  */
  if (filteredChecker.length >= 1) {
    const filterWarningSSL = filteredChecker.filter((result) => result.remaining <= warnDays);
    if (filterWarningSSL.length > 0) {
      return await teleServices.sendWarningMessage(botToken, chatId, filterWarningSSL, title);
    }
  }
};

const monitoringDomainExpired = async (warnDays, botToken, chatId, title) => {
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
    if (remainingDays <= warnDays) {
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
   * * Filtering data from live checker, get data domain when remaining < warnDays
  */
  if (filteredChecker.length >= 1) {
    const filteredData = liveChecker.filter((result) => result.remaining <= warnDays);
    if (filteredData.length > 0) {
      await teleServices.sendWarningDomainMessage(botToken, chatId, filteredData, title);
    }
  }
};

bot.hears("CEK SSL", (ctx) => {
  monitoringSSLExpired(1000, BOT_TOKEN, ctx.chat.id, "TEST BOT SSL");
});

bot.hears("CEK DOMAIN", (ctx) => {
  monitoringDomainExpired(1000, BOT_TOKEN, ctx.chat.id, "TEST BOT DOMAIN");
});

bot.hears("FORMAT", (ctx) => {
  ctx.telegram.sendMessage(ctx.chat.id, ">>>>> Format Aksi BOT <<<<<\n\n** Tambah Monitoring SSL **\n/ssl#Aksi#Nama#Domain#Port#Tempat\nContoh\n/ssl#Tambah#Web Report PMK#report.serverpmk.com#443#10.5.7.208\n\n** Tambah Monitoring Domain **\n/domain#Aksi#Hosting#Domain\nContoh\n/domain#Tambah#Niagahoster#unitedtronik.co.id");
});

Cron("0 0 7 * * *", { timezone: "Asia/Jakarta" }, async () => {
  await teleServices.sendSelfAlert(BOT_TOKEN, process.env.ID_MY, "Cron Running Gaiss...");
  monitoringSSLExpired(7, BOT_TOKEN, SEND_TO_ID, "SSL ALERT");
  monitoringDomainExpired(7, BOT_TOKEN, SEND_TO_ID, "DOMAIN ALERT");
});

Cron("0 0 9 * * 1", { timezone: "Asia/Jakarta" }, async () => {
  monitoringSSLExpired(1000, BOT_TOKEN, SEND_TO_ID, "SSL ALL INFO");
  monitoringDomainExpired(1000, BOT_TOKEN, SEND_TO_ID, "DOMAIN ALL INFO");
});

bot.launch();
