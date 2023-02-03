const sslChecker = require("ssl-checker");
const { formatDate } = require("../../utils/DateService");

exports.getSSLStatus = async (domain, port = 443) => {
  const result = await sslChecker(domain, { method: "GET", port });
  console.log(`[${formatDate(new Date().toISOString())}] Monitoring SSL ${domain} ${port}`);
  return {
    remaining: result.daysRemaining,
    expired: result.validTo,
    status: result.valid,
  };
};
