exports.formatDate = (isoString) => {
  const date = new Date(isoString);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  hours = hours < 10 ? `0${hours}` : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  const strTime = `${hours}:${minutes}:${seconds}`;
  return `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()} ${strTime}`;
};

exports.monitoringSSLExpired = async (warnDays, botToken, chatId, title) => {
  /**
   * * Read all data ssl domain from database
  */
  const resultSSLDomains = await mysqlServices.readAllSslDomain();
  /**
   * * Result variable is check remaining days all ssl domain with live checking
  */
  const liveSSLChecker = await Promise.all(resultSSLDomains.map(async (result) => {
    const sslStatus = await checkerServices.getSSLStatus(result.domain, result.port);
    const newExpired = formatDate(sslStatus.expired);
    if (sslStatus.remaining <= warnDays) {
      return {
        nama: result.nama,
        domain: result.domain,
        remaining: sslStatus.remaining,
        status: sslStatus.status,
        expired: newExpired,
        tempat: result.tempat,
      };
    }
    return false;
  }));
  const filteredChecker = liveSSLChecker.filter((result) => result !== false);
  /**
   * * Filtering data from live checker, get data ssl when remaining < warnDays
  */
  if (filteredChecker.length >= 1) {
    const filterWarningSSL = filteredChecker.filter((result) => result.remaining <= warnDays);
    if (filterWarningSSL.length > 0) {
      return await teleServices.sendWarningMessage(botToken, chatId, filterWarningSSL, title);
    }
  }
};

exports.monitoringDomainExpired = async (warnDays, botToken, chatId, title) => {
  /**
   * * Read all data domain from database
  */
  const results = await mysqlServices.readAllDomain();
  /**
   * * Result variable is check remaining days all domain with live checking
  */
  const liveChecker = await Promise.all(results.map(async (result) => {
    const today = new Date().getTime();
    const checkDomain = await checkerServices.getInformationDomain(result.domain);
    const dateOfDomain = new Date(checkDomain.expires_on).getTime();
    const remainingTime = dateOfDomain - today;
    const remainingDays = Math.round(remainingTime / (1000 * 60 * 60 * 24));
    console.log(checkDomain);
    const newFormatDateDomain = formatDate(new Date(dateOfDomain).toISOString());
    if (remainingDays <= warnDays) {
      return {
        hosting: result.hosting,
        remaining: remainingDays,
        domain: result.domain,
        expired: newFormatDateDomain,
      }
    }
    return false;
  }));
  const filteredChecker = liveChecker.filter((result) => result !== false);
  /**
   * * Filtering data from live checker, get data domain when remaining < warnDays
  */
  if (filteredChecker.length >= 1) {
    const filteredData = liveChecker.filter((result) => result.remaining <= warnDays);
    if (filteredData.length > 0) {
      await teleServices.sendWarningDomainMessage(botToken, chatId, filteredData, title);
    }
  }
};
