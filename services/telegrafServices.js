const { Telegraf } = require("telegraf");
const { webhookCallback } = require("telegraf/extra");

const BOT_TOKEN = process.env.BOT_TOKEN;

const TelegramBot = new Telegraf(BOT_TOKEN);

module.exports = {
  TelegramBot,
  webhookCallback,
};
