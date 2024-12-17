const axios = require("axios");

const authKey = "T1PhA56LPJysMHFZ62B5";
const authToken = "8S2pMXV8IRpZP6P37p4SWrVErk2N6CzSEa458pt1";
const credentials = `${authKey}:${authToken}`;
const encodedCredentials = Buffer.from(credentials).toString("base64");
const config = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${encodedCredentials}`,
  },
};
const fetchDeliveryReport = async (messageUUID) => {
    try {
      const response = await axios.get(
        `https://restapi.smscountry.com/v0.1/Accounts/${authKey}/SMSes/${messageUUID}/`,
        config
      );
      console.log("Delivery Report Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching delivery report:", error.message);
      return null;
    }
  };
  

module.exports={fetchDeliveryReport}