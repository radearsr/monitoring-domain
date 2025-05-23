require("dotenv").config();
const Cron = require("croner");
const { TelegramBot } = require("./services/telegrafServices");
const { MESSAGE_REPLY } = require("./utils/replyMessageUtils");
const actionServices = require("./services/actionServices");
const senderServices = require("./services/senderServices");
const {
  monitoringDomainExpired,
  monitoringSSLExpired,
} = require("./services/monitoringServices");
const logger = require("./utils/loggingUtils");

TelegramBot.start((ctx) => {
  ctx.reply(MESSAGE_REPLY.START_COMMAND, {
    reply_markup: {
      keyboard: MESSAGE_REPLY.KEYBOARD_START,
      resize_keyboard: true,
    },
  });
});

TelegramBot.hears("FORMAT", (ctx) => {
  ctx.reply(MESSAGE_REPLY.FORMAT_COMMAND);
});

TelegramBot.hears(/^SSL#(.+)#(.+)#(.+)#(.+)#(.+)/, async (ctx) => {
  logger.info(ctx.message.text);
  const addedSsl = await actionServices.sslAction(ctx.message.text);
  ctx.reply(addedSsl, { disable_web_page_preview: true });
});

TelegramBot.hears(/^DOMAIN#(.+)#(.+)#(.+)/, async (ctx) => {
  logger.info(ctx.message.text);
  const addedDomain = await actionServices.domainAction(ctx.message.text);
  ctx.reply(addedDomain);
});

TelegramBot.hears("CEK SSL", (ctx) => {
  logger.info(ctx.message.text);
  monitoringSSLExpired(
    1000,
    process.env.BOT_TOKEN,
    ctx.chat.id,
    "TEST BOT SSL"
  );
});

TelegramBot.hears("CEK DOMAIN", (ctx) => {
  logger.info(ctx.message.text);
  monitoringDomainExpired(
    1000,
    process.env.BOT_TOKEN,
    ctx.chat.id,
    "TEST BOT DOMAIN"
  );
});

Cron("0 0 7 * * *", { timezone: "Asia/Jakarta" }, async () => {
  logger.info("CRON RUNNING...");
  await senderServices.sendSelfAlert(
    process.env.BOT_TOKEN,
    process.env.ID_MY,
    "Cron Running hari ini..."
  );
  monitoringSSLExpired(
    7,
    process.env.BOT_TOKEN,
    process.env.GROUP_ID,
    "SSL ALERT"
  );
  monitoringDomainExpired(
    7,
    process.env.BOT_TOKEN,
    process.env.GROUP_ID,
    "DOMAIN ALERT"
  );
});

TelegramBot.launch();
