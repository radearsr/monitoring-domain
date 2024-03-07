const axios = require("axios");

const ENDPOINT_MONITORING = process.env.ENDPOINT_MONITORING;

exports.getInformationDomain = async (domain) => {
  try {
    const trimedDomain = domain.trim();
    const { data } = await axios.get(
      `${ENDPOINT_MONITORING}/api/check/domain`,
      {
        params: { domain: trimedDomain },
      }
    );
    return data;
  } catch (error) {
    console.log(error.response.data);
    if (axios.isAxiosError(error)) {
      throw new Error(`&-&${domain}&-&${error.response.data.error}`);
    }
    throw new Error(`&-&${domain}&-&${error.message}`);
  }
};

exports.getSSLStatus = async (domain, port = 443) => {
  try {
    const trimedDomain = domain.trim();
    const { data } = await axios.get(`${ENDPOINT_MONITORING}/api/check/ssl`, {
      params: { domain: trimedDomain, port },
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`&-&${domain}&-&${port}&-&${error.response.data.error}`);
    }
    throw new Error(`&-&${domain}&-&${port}&-&${error.message}`);
  }
};
