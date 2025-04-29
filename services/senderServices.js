const axios = require("axios");

const searchDetailDomainError = errorText => {
  const [, domain, message] = errorText.toString().split("&-&");
  return { domain, message };
};

const searchDetailSSLError = errorText => {
  const [, domain, port, message] = errorText.toString().split("&-&");
  return { domain, port, message };
};

const sendWarningMessage = async (teleToken, teleMessageId, datas, title) => {
  datas.forEach((data, index) => {
    setTimeout(async () => {
      const message = `>>>>>${title}<<<<<\n\nNama       : ${data.value.nama}\nDomain   : ${data.value.domain}\nSisa Hari  : ${data.value.remaining} Hari\nIP PC         : ${data.value.tempat}\nExpired    : ${data.value.expired}\nSegera Lakukan Renew SSL!!\n`;
      await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
        params: {
          chat_id: teleMessageId,
          text: message,
        },
      });
    }, 3000 * index);
  });
};

const sendErrorDomainMessage = async (
  teleToken,
  teleMessageId,
  datas,
  title
) => {
  datas.forEach((data, index) => {
    setTimeout(async () => {
      const { domain, message } = searchDetailDomainError(data.reason);
      const messageText = `>>>>>${title}<<<<<\n\nMohon Akses Link Whois\nDomain   : ${domain}\nPesan : ${message}\nWhois  : https://www.whois.com/whois/${domain}\n`;
      await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
        params: {
          chat_id: teleMessageId,
          text: messageText,
          disable_web_page_preview: true,
        },
      });
    }, index * 3000);
  });
};

const sendErrorSSLMessage = async (teleToken, teleMessageId, datas, title) => {
  datas.forEach((data, index) => {
    setTimeout(async () => {
      const { domain, port, message } = searchDetailSSLError(data.reason);
      const messageText = `>>>>>${title}<<<<<\n\nWeb tidak bisa diakses\nDomain   : ${domain}\nPort  : ${port}\nPesan : ${message}`;
      await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
        params: {
          chat_id: teleMessageId,
          text: messageText,
          disable_web_page_preview: true,
        },
      });
    }, index * 3000);
  });
};

const sendWarningDomainMessage = async (
  teleToken,
  teleMessageId,
  datas,
  title
) => {
  datas.forEach((data, index) => {
    setTimeout(async () => {
      const messageText = `>>>>>${title}<<<<<\n\nHosting    : ${data.value.hosting}\nDomain   : ${data.value.domain}\nSisa Hari  : ${data.value.remaining} Hari\nExpired    : ${data.value.expired}\nSegera Perpanjang Domain!!\n`;
      await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
        params: {
          chat_id: teleMessageId,
          text: messageText,
        },
      });
    }, index * 3000);
  });
};

const sendSelfAlert = async (teleToken, teleMessageId, messageForSend) => {
  const message = `>>>>>ALERT BOY<<<<<\n\n${messageForSend}`;
  await axios.get(`https://api.telegram.org/bot${teleToken}/sendMessage`, {
    params: {
      chat_id: teleMessageId,
      text: message,
    },
  });
};

module.exports = {
  sendWarningMessage,
  sendErrorDomainMessage,
  sendErrorSSLMessage,
  sendWarningDomainMessage,
  sendSelfAlert,
  searchDetailDomainError,
  searchDetailSSLError,
};
