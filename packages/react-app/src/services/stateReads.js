import ethers from "ethers";
import { getMiniAddress } from "../utils/helpers";
import { addresses, abis } from "@project/contracts";
import { GelatoCore } from "@gelatonetwork/core";
import { GAS_LIMIT_CETH_TO_AETH } from "../utils/constants";
const MAKER_RESOLVER_JSON = require("../abi/MakerResolver.json");

const {
  INSTA_LIST_ADDR,
  GELATO_CORE,
  MAKER_RESOLVER_ADDR
} = addresses;
const { InstaList } = abis;

export const getUserAddress = async (provider) => {
  const signer = await provider.getSigner();
  return await signer.getAddress();
};

export const getMiniUserAddress = async (provider) => {
  return getMiniAddress(await getUserAddress(provider));
};

export const getUserProxy = async (user) => {
  const signer = await user.getSigner();
  const userAddr = await signer.getAddress();
  const instaListContract = new ethers.Contract(
    INSTA_LIST_ADDR,
    InstaList.abi,
    signer
  );
  return await instaListContract.accountAddr((await instaListContract.userLink(userAddr)).first);
}

export const getUserProxyContract = async (user) => {
  const signer = await user.getSigner();
  const userProxyAddr = await getUserProxy(user);
  return new ethers.Contract(
    userProxyAddr,
    [
      "function cast(address[] _targets, bytes[] _datas, address _origin) payable",
      "function isAuth(address user) view returns (bool)",
    ],
    signer
  )
}

export const getGelatoGasPrice = async (provider) => {
  const gelatoCoreContract = new ethers.Contract(
    GELATO_CORE,
    GelatoCore.abi,
    provider
  );

  const oracleAbi = ["function latestAnswer() view returns (int256)"];

  const gelatoGasPriceOracleAddress = await gelatoCoreContract.gelatoGasPriceOracle();

  // Get gelatoGasPriceOracleAddress
  const gelatoGasPriceOracle = new ethers.Contract(
    gelatoGasPriceOracleAddress,
    oracleAbi,
    provider
  );

  // lastAnswer is used by GelatoGasPriceOracle as well as the Chainlink Oracle
  return await gelatoGasPriceOracle.latestAnswer();
};

export const getTokenBalance = async (userAccount, token) => {
  const tokenContract = new ethers.Contract(token, [
    "function balanceOf(address) view returns (uint256)"
  ], userAccount);
  const userProxyAddress = await getUserProxy(userAccount);
  const userBalance = await tokenContract.balanceOf(userProxyAddress);
  return userBalance;
};

export const getTokenBalanceString = async (
  userAccount,
  token,
  tokenSymbol,
  decimals
) => {
  const userBalance = await getTokenBalance(userAccount, token);
  const userBalanceHumanReadable = ethers.utils.formatUnits(
    userBalance,
    decimals
  );
  return `${parseFloat(userBalanceHumanReadable).toFixed(8)} ${tokenSymbol}`;
};

export const getETHAVaultDebt = async (user, userAddr) => {
  const vault = await getVault(user, userAddr, "ETH-A");
  if (vault === undefined) return 0;
  return vault.debt;
}

export const getETHAVaultCols = async (user, userAddr) => {
  const vault = await getVault(user, userAddr, "ETH-A");
  if (vault === undefined) return 0;
  return vault.collateral;
}

export const getETHBVaultDebt = async (user, userAddr) => {
  const vault = await getVault(user, userAddr, "ETH-B");
  if (vault === undefined) return 0;
  return vault.debt;
}

export const getETHBVaultCols = async (user, userAddr) => {
  const vault = await getVault(user, userAddr, "ETH-B");
  if (vault === undefined) return 0;
  return vault.collateral;
}

export const gelatoIsAuth = async (user) => {
  const userProxyContract = await getUserProxyContract(user);
  return userProxyContract.isAuth(GELATO_CORE);
}

export const userHaveETHAVault = async (user, userAddr) => {
  return await getVault(user, userAddr, "ETH-A") !== undefined;
}

export const userHaveETHBVault = async (user, userAddr) => {
  return await getVault(user, userAddr, "ETH-B") !== undefined;
}

export const getVault = async (user, userAddr, colType) => {
  const signer = await user.getSigner();
  const makerResolverContract = new ethers.Contract(
    MAKER_RESOLVER_ADDR,
    MAKER_RESOLVER_JSON.abi,
    signer
  );

  let vaults = await makerResolverContract.getVaults(userAddr);
  for(let i=0; i<vaults.length; i++) {
    if(vaults[i].colType === colType) {
      return vaults[i];
    }
  }
  return undefined;
}