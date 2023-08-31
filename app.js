require("dotenv").config();
const Cron = require("croner");
const { TelegramBot } = require("./services/telegrafServices");
const { MESSAGE_REPLY } = require("./utils/replyMessageUtils");
const actionServices = require("./services/actionServices");
const teleServices = require("./services/senderServices");

TelegramBot.start((ctx) => {
  ctx.reply(MESSAGE_REPLY.START_COMMAND, {
    reply_markup: {
      keyboard: MESSAGE_REPLY.KEYBOARD_START,
      resize_keyboard: true
    }
  });
});

TelegramBot.hears("FORMAT", (ctx) => {
  ctx.reply(MESSAGE_REPLY.FORMAT_COMMAND);
});

TelegramBot.hears(/^SSL#(.+)#(.+)#(.+)#(.+)#(.+)/, async (ctx) => {
  const addedSsl = await actionServices.sslAction(ctx.message.text);
  ctx.reply(addedSsl);
});

TelegramBot.hears(/^DOMAIN#(.+)#(.+)#(.+)/, async (ctx) => {
  const addedDomain = await actionServices.domainAction(ctx.message.text);
  ctx.reply(addedDomain);
});

TelegramBot.hears("CEK SSL", (ctx) => {
  monitoringSSLExpired(1000, BOT_TOKEN, ctx.chat.id, "TEST BOT SSL");
});

TelegramBot.hears("CEK DOMAIN", (ctx) => {
  monitoringDomainExpired(1000, BOT_TOKEN, ctx.chat.id, "TEST BOT DOMAIN");
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

TelegramBot.launch();
