const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = process.env.NODE_ENV === "production" ? process.env.BOT_TOKEN : process.env.BOT_TOKEN_DEV;   
const SEND_TO_ID = process.env.NODE_ENV === "production" ? process.env.ID_GROUP_MONIT_SERVER : process.env.ID_MY;
const WARN_DAYS = process.env.NODE_ENV === "production" ? 7 : 300;

const TelegramBot = new Telegraf(BOT_TOKEN);

module.exports = {
  TelegramBot,
};
