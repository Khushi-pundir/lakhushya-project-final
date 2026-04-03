const axios = require("axios");

const geoRes = await axios.get(
  `https://apis.mappls.com/advancedmaps/v1/593686c390c3f05902e6149ce270c9d1/geo_code`,
  {
    params: {
      address: address
    }
  }
);

const lat = geoRes.data.results[0].lat;
const lng = geoRes.data.results[0].lng;