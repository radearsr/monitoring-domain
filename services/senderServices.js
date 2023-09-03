const axios = require("axios");

const searchDetailDomainError = (errorText) => {
  const [,domain, message] = errorText.toString().split("&-&");
  return { domain, message };
};

const searchDetailSSLError = (errorText) => {
  const [,domain, port, message] = errorText.toString().split("&-&");
  return { domain, port, message};
};

exports.sendWarningMessage = async (teleToken, teleMessageId, datas, title) => {
  const parsingData = datas.map((data) => {
    return `Nama       : ${data.value.nama}\nDomain   : ${data.value.domain}\nSisa Hari  : ${data.value.remaining} Hari\nIP PC         : ${data.value.tempat}\nExpired    : ${data.value.expired}\nSegera Lakukan Renew SSL!!\n`;
  }).join("\n");
  const message = `>>>>>${title}<<<<<\n\n${parsingData}`;
  await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
    params: {
      chat_id: teleMessageId,
      text: message,
    }
  });
};

exports.sendErrorDomainMessage = async (teleToken, teleMessageId, datas, title) => {
  const parsingData = datas.map((data) => {
    const { domain, message } = searchDetailDomainError(data.reason);
    return `Mohon Akses Link Whois\nDomain   : ${domain}\nPesan : ${message}\nWhois  : https://www.whois.com/whois/${domain}\n`;
  }).join("\n");
  const message = `>>>>>${title}<<<<<\n\n${parsingData}`;
  await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
    params: {
      chat_id: teleMessageId,
      text: message,
    }
  });
};

exports.sendErrorSSLMessage = async (teleToken, teleMessageId, datas, title) => {
  const parsingData = datas.map((data) => {
    const { domain, port, message } = searchDetailSSLError(data.reason);
    return `Web tidak bisa diakses\nDomain   : ${domain}\nPort  : ${port}\nPesan : ${message}`;
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
    return `Hosting    : ${data.value.hosting}\nDomain   : ${data.value.domain}\nSisa Hari  : ${data.value.remaining} Hari\nExpired    : ${data.value.expired}\nSegera Perpanjang Domain!!\n`;
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
