require("dotenv").config();
const { Telegraf } = require("telegraf");
const checkerServices = require("./services/checker/checkerServices");
const mysqlServices = require("./services/mysql/mysqlServices");
const { formatDate } = require("./utils/DateService");
const sslChecker = require("ssl-checker");

const BOT_TOKEN = process.env.NODE_ENV === "production" ? process.env.BOT_TOKEN : process.env.BOT_TOKEN_DEV;   
const WARN_DAYS = process.env.NODE_ENV === "production" ? 7 : 300;
const SEND_TO_ID = process.env.NODE_ENV === "production" ? process.env.ID_GROUP_MONIT_SERVER : process.env.ID_MY;

console.log({ BOT_TOKEN, WARN_DAYS, SEND_TO_ID });
const bot = new Telegraf(BOT_TOKEN);

bot.command("start", async (ctx) => {
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
      const sslStatus = await checkerServices.getSSLStatus(domain, port);
      await ctx.telegram.sendMessage(ctx.chat.id, `SSL Expired ${formatDate(sslStatus.validTo)}`);
    }
  } catch (error) {
    switch (error.message) {
      case "SSL_DOMAIN_AVAILABLE":
        ctx.telegram.sendMessage(ctx.chat.id, "SSL Domain Sudah Tersedia");
        const sslStatus = await sslChecker(domain, { method: "GET", port });
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

bot.launch();
