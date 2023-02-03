const cheerio = require("cheerio");
const axios = require("axios");
const { formatDate } = require("../../utils/DateService");

exports.getInformationDomain = async (domain) => {
  console.log(`[${formatDate(new Date().toISOString())}] Monitoring Start ${domain}`);
  const { data } = await axios.get(`https://www.whois.com/whois/${domain}`);
  const $ = cheerio.load(data);
  const jsonDataResult = {};
  $(".df-row").each((_id, element) => {
    const title = $(element.firstChild).text();
    const value = $(element.firstChild.nextSibling).text();
    const fixedTitle = title.toLocaleLowerCase().split(" ").join("_");
    jsonDataResult[fixedTitle.replace(":", "")] = value;
  });
  console.log(`[${formatDate(new Date().toISOString())}] Monitoring End ${domain}`);
  return jsonDataResult;
};
