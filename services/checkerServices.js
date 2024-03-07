const cheerio = require("cheerio");
const axios = require("axios");
const sslChecker = require("ssl-checker");

exports.getInformationDomain = async (domain) => {
  try {
    const { data } = await axios.get(`https://www.whois.com/whois/${domain}`);
    const $ = cheerio.load(data);
    const scrapingResult = {
      domain: "",
      registrar: "",
      registered_on: "",
      expires_on: "",
      updated_on: "",
      status: "",
      name_servers: "",
    };
    $(".df-row").each((_id, element) => {
      const title = $(element.firstChild).text();
      const value = $(element.firstChild.nextSibling).text();
      const fixedTitle = title.toLocaleLowerCase().split(" ").join("_");
      scrapingResult[fixedTitle.replace(":", "")] = value;
    });
    if (!scrapingResult.expires_on) throw new Error("DATA_SCRAPING_IS_EMPTY");
    const today = new Date().getTime();
    const dateOfDomain = new Date(scrapingResult.expires_on).getTime();
    const remainingTime = dateOfDomain - today;
    const remainingDays = Math.round(remainingTime / (1000 * 60 * 60 * 24));
    if (remainingDays <= 0) throw new Error("REMAINING_DAYS_IS_MINUS");
    return {
      ...scrapingResult,
      expired: new Date(dateOfDomain).toISOString(),
      remaining: remainingDays,
    };
  } catch (error) {
    throw new Error(`&-&${domain}&-&${error.message}`);
  }
};

exports.getSSLStatus = async (domain, port = 443) => {
  try {
    const trimedDomain = domain.trim();
    const chekerResult = await sslChecker(trimedDomain, {
      method: "GET",
      port,
    });
    if (chekerResult.daysRemaining <= 0)
      throw new Error("REMAINING_DAYS_IS_MINUS");
    return {
      remaining: chekerResult.daysRemaining,
      expired: chekerResult.validTo,
      status: chekerResult.valid,
    };
  } catch (error) {
    throw new Error(`&-&${domain}&-&${port}&-&${error.message}`);
  }
};
