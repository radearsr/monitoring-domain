const axios = require("axios");

exports.sendWarningMessage = async (teleToken, teleMessageId, datas, title) => {
  const parsingData = datas.map((data) => {
    return `Nama       : ${data.nama}\nDomain   : ${data.domain}\nSisa Hari  : ${data.remaining} Hari\nIP PC         : ${data.tempat}\nExpired    : ${data.expired}\nSegera Lakukan Renew SSL!!\n`;
  }).join("\n");
  const message = `>>>>>${title}<<<<<\n\n${parsingData}`;
  await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
    params: {
      chat_id: teleMessageId,
      text: message,
    }
  });
};

exports.sendWarningDomainMessage = async (teleToken, teleMessageId, datas, title) => {
  const parsingData = datas.map((data) => {
    return `Hosting    : ${data.hosting}\nDomain   : ${data.domain}\nSisa Hari  : ${data.remaining} Hari\nExpired    : ${data.expired}\nSegera Perpanjang Domain!!\n`;
  }).join("\n");
  const message = `>>>>>${title}<<<<<\n\n${parsingData}`;
  await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
    params: {
      chat_id: teleMessageId,
      text: message,
    }
  });
};

exports.sendSelfAlert = async (teleToken, teleMessageId, messageForSend) => {
  const message = `>>>>>ALERT BOY<<<<<\n\n${messageForSend}`;
  await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
    params: {
      chat_id: teleMessageId,
      text: message,
    }
  });
};
