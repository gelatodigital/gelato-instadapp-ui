const assert = require("assert");
require("dotenv").config();

const ALCHEMY_ID = process.env.ALCHEMY_ID;
assert.ok(ALCHEMY_ID, "no Mainnet Alchemy ID in process.env");
console.log("Hardhat init");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // Standard config
      // timeout: 150000,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
        // blockNumber: 11282999,
      },
    },
  },
  solidity: "0.7.3",
};
