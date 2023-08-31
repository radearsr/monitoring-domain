const cheerio = require("cheerio");
const axios = require("axios");
const sslChecker = require("ssl-checker");
const { formatDate } = require("../utils/dateService");

exports.getInformationDomain = async (domain) => {
  const { data } = await axios.get(`https://www.whois.com/whois/${domain}`);
  const $ = cheerio.load(data);
  const jsonDataResult = {
    domain: "",
    registrar: "",
    registered_on: "",
    expires_on: "",
    updated_on: "",
    status: "",
    name_servers: ""
  };
  $(".df-row").each((_id, element) => {
    const title = $(element.firstChild).text();
    const value = $(element.firstChild.nextSibling).text();
    const fixedTitle = title.toLocaleLowerCase().split(" ").join("_");
    jsonDataResult[fixedTitle.replace(":", "")] = value;
  });
  return jsonDataResult;
};

exports.getSSLStatus = async (domain, port = 443) => {
  const trimedDomain = domain.trim();
  const result = await sslChecker(trimedDomain, { method: "GET", port });
  console.log(`[${formatDate(new Date().toISOString())}] Monitoring SSL ${domain} ${port}`);
  return {
    remaining: result.daysRemaining,
    expired: result.validTo,
    status: result.valid,
  };
};
