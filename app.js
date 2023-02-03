require("dotenv").config();
const { Telegraf } = require("telegraf");
const checkerServices = require("./services/checker");
const mysqlServices = require("./services/mysql/mysqlServices");
const teleServices = require("./services/telegram/telegramService");
const { formatDate } = require("./utils/DateService");

const bot = new Telegraf(process.env.BOT_TOKEN);

const WARN_DAYS = 300;

bot.command("/start", (ctx) => {
  ctx.telegram.sendMessage(ctx.chat.id, "Hello I'm IT Support BOT :)");
});

bot.command("/format", (ctx) => {
  ctx.telegram.sendMessage(ctx.chat.id, ">>>>> Format Aksi BOT <<<<<\n\n** Tambah Monitoring SSL **\n/ssl#Aksi#Nama#Domain#Port#Tempat\nContoh\n/ssl#Tambah#Web Report PMK#report.serverpmk.com#443#10.5.7.208\n\n** Tambah Monitoring Domain **\n/domain#Aksi#Hosting#Domain\nContoh\n/domain#Tambah#Niagahoster#unitedtronik.co.id");
})

bot.command("/ssl", async (ctx) => {
  const { text: msg } = ctx.message;
  const [,
    action,
    nama,
    domain,
    port,
    tempat,
  ] = msg.split("#") || "";

  if (action === "Tambah") {
    const addedDomainSsl = await mysqlServices.insertIntoSslDomain(nama, domain, port, tempat);
    addedDomainSsl.affectedRows >= 1 ?
      ctx.telegram.sendMessage(ctx.chat.id, "Berhasil Menambahkan Domain Cek SSL Baru") :
      ctx.telegram.sendMessage(ctx.chat.id, "Gagal Menambahkan Domain Cek SSL Baru");
    const sslStatus = await checkerServices.sslChecker(domain, port);
    ctx.telegram.sendMessage(ctx.chat.id, `SSL Expired ${formatDate(sslStatus.expired)}`);
    const updatedSslExpired = await mysqlServices.updateSslExpired(domain, sslStatus.expired);
    updatedSslExpired.affectedRows >= 1 ? 
      ctx.telegram.sendMessage(ctx.chat.id, "Berhasil Memperbarui Expired SSL") :
      ctx.telegram.sendMessage(ctx.chat.id, "Gagal Memperbarui Expired SSL");
  }
});

bot.command("/domain", async (ctx) => {
  const { text: msg } = ctx.message;
  const [,
    action,
    hosting,
    domain,
  ] = msg.split("#") || "";
  if (action === "Tambah") {
    const addedMainDomain = await mysqlServices.insertIntoMainDomain(hosting, domain);
    addedMainDomain.affectedRows >= 1 ?
      ctx.telegram.sendMessage(ctx.chat.id, "Berhasil Menambahkan Domain Baru") :
      ctx.telegram.sendMessage(ctx.chat.id, "Gagal Menambahkan Domain");
    const domainExpired = await checkerServices.domainChecker(domain);
    const updatedMainDomainExpired = await mysqlServices.updateExpiredMainDomain(domainExpired.expires_on, domain);
    ctx.telegram.sendMessage(ctx.chat.id, `Domain Expired ${domainExpired.expires_on}`);
    updatedMainDomainExpired.affectedRows >= 1 ?
      ctx.telegram.sendMessage(ctx.chat.id, "Berhasil memperbarui expired domain") :
      ctx.telegram.sendMessage(ctx.chat.id, "Gagal memperbarui expired domain");  
  }
});


const monitoringSSLExpired = async () => {
  try {
    // Read Data From Database
    const resultDomains = await mysqlServices.readAllSslDomain();
    // Check status, and remaining days all ssl with local DB
    const resultLocalChecker = resultDomains.map((result) => {
      const today = new Date().getTime();
      const dateOfSSL = new Date(result.expired).getTime();
      const remainingTime = dateOfSSL - today;
      const remainingDays = Math.round(remainingTime / (1000 * 60 * 60 * 24));
      const newExpired = formatDate(result.expired);
      return {
        nama: result.nama,
        domain: result.domain,
        port: result.port,
        remaining: remainingDays,
        expired: newExpired,
        tempat: result.tempat,
      };
    });

    const liveSSLChecker = async (localSSLCheckers) => (
      await Promise.all(localSSLCheckers.map(async (result) => {
        const sslStatus = await checkerServices.sslChecker(result.domain, result.port);
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
        await mysqlServices.updateSslExpired(result.domain, sslStatus.expired)
      }))
    );

    // Filter domain
    const filterWarningSSL = resultLocalChecker.filter((result) => result.remaining <= WARN_DAYS);
    
    if (filterWarningSSL.length > 0) {
      const liveWarningExpired = await liveSSLChecker(filterWarningSSL);
      const dataSended = liveWarningExpired.filter((result) => result !== undefined);
      if (dataSended.length >= 1) {
        return await teleServices.sendWarningMessage(bot, process.env.ID_MY, liveWarningExpired);
      }
      console.log(`[${formatDate(new Date().toISOString())}] EXPIRED SSL UPDATED...`);
    }
  } catch (error) {
    throw new Error(error);
  }
};

const monitoringDomainExpired = async () => {
  try {
    // Read data from database
    const results = await mysqlServices.readAllDomain();
    // Check remaining days all domain with local DB
    const localChecker = results.map((result) => {
      const today = new Date().getTime();
      const dateOfDomain = new Date(result.expired).getTime();
      const remainingTime = dateOfDomain - today;
      const remainingDays = Math.round(remainingTime / (1000 * 60 * 60 * 24));
      const newExpired = formatDate(result.expired);
      return {
        hosting: result.hosting,
        remaining: remainingDays,
        domain: result.domain,
        expired: newExpired,
      };
    });
    // Function check remaining days all domain with live data
    const liveChecker = async (localResults) => (
      await Promise.all(localResults.map(async (result) => {
        const today = new Date().getTime();
        const checkDomain = await checkerServices.domainChecker(result.domain);
        const dateOfDomain = new Date(checkDomain.expires_on).getTime();
        const remainingTime = dateOfDomain - today;
        const remainingDays = Math.round(remainingTime / (1000 * 60 * 60 * 24));
        if (remainingDays <= WARN_DAYS) {
          return {
            hosting: result.hosting,
            remaining: remainingDays,
            domain: result.domain,
            expired: result.expired,   
          }
        }
        await mysqlServices.updateExpiredMainDomain(checkDomain.expires_on, result.domain);
      }))
    );
    // Filter when data remaining <= WARN_DAYS
    const filterLocalWarningExpired = localChecker.filter((result) => result.remaining <= WARN_DAYS);

    if (filterLocalWarningExpired.length > 0) {
      const liveWarningExpired = await liveChecker(filterLocalWarningExpired);
      const dataSended = liveWarningExpired.filter((result) => result !== undefined);
      if (dataSended.length >= 1) {
        return await teleServices.sendWarningDomainMessage(bot, process.env.ID_MY, liveWarningExpired);
      }
      console.log(`[${formatDate(new Date().toISOString())}] EXPIRED DOMAIN UPDATED...`);
    }
  } catch (error) {
    throw new Error(error);
  }
};

// setInterval(() => {
//   monitoringSSLExpired();
// }, (1000 * 60 * 2));
// setInterval(() => {
//   monitoringSSLExpired();
// }, (1000 * 60 * 2));

// monitoringSSLExpired();
monitoringDomainExpired();

bot.launch();
