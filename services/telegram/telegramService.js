exports.sendWarningMessage = async (ctx, chatId, datas) => {
  const parsingData = datas.map((data) => {
    return `Nama       : ${data.nama}\nDomain   : ${data.domain}\nSisa Hari  : ${data.remaining} Hari\nIP PC         : ${data.tempat}\nExpired    : ${data.expired}\nSegera Lakukan Renew SSL!!\n`;
  }).join("\n");
  const message = `>>>>>SSL ALERT<<<<<\n\n${parsingData}`;
  await ctx.telegram.sendMessage(chatId, message);
};

exports.sendWarningDomainMessage = async (ctx, chatId, datas) => {
  const parsingData = datas.map((data) => {
    return `Hosting    : ${data.hosting}\nDomain   : ${data.domain}\nSisa Hari  : ${data.remaining} Hari\nExpired    : ${data.expired}\nSegera Perpanjang Domain!!\n`;
  }).join("\n");
  const message = `>>>>>DOMAIN ALERT<<<<<\n\n${parsingData}`;
  await ctx.telegram.sendMessage(chatId, message);
};
