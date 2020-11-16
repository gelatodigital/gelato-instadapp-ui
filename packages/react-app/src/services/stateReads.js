import ethers from "ethers";
import { getMiniAddress } from "../utils/helpers";
import { addresses, abis } from "@project/contracts";
import { GelatoCore } from "@gelatonetwork/core";
import { GAS_LIMIT_CETH_TO_AETH } from "../utils/constants";

const {
  INSTA_LIST_ADDR,
  GELATO_CORE,
  MAKER_RESOLVER_ADDR
} = addresses;
const { InstaList, erc20 } = abis;

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
  const instaIndexContract = new ethers.Contract(
    INSTA_LIST_ADDR,
    InstaList.abi,
    signer
  );
  return (await instaIndexContract.userLink(userAddr)).first;
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

export const getTokenBalance = async (provider, token) => {
  const tokenContract = new ethers.Contract(token, erc20, provider);
  const userAddress = await getUserAddress(provider);
  const userBalance = await tokenContract.balanceOf(userAddress);
  return userBalance;
};

export const getTokenBalanceString = async (
  provider,
  token,
  tokenSymbol,
  decimals
) => {
  const userBalance = await getTokenBalance(provider, token);
  const userBalanceHumanReadable = ethers.utils.formatUnits(
    userBalance,
    decimals
  );
  return `${parseFloat(userBalanceHumanReadable).toFixed(8)} ${tokenSymbol}`;
};

export const getETHAVaultDebt = async (user) => {
  const vault = await getVault(user, "ETH-A");
  if (vault === undefined) return;
  return vault.debt;
}

export const getETHAVaultCols = async (user) => {
  const vault = await getVault(user, "ETH-A");
  if (vault === undefined) return;
  return vault.collateral;
}

export const getETHBVaultDebt = async (user) => {
  const vault = await getVault(user, "ETH-B");
  if (vault === undefined) return;
  return vault.debt;
}

export const getETHBVaultCols = async (user) => {
  const vault = await getVault(user, "ETH-B");
  if (vault === undefined) return;
  return vault.collateral;
}

export const gelatoIsAuth = async (user) => {
  const userProxyContract = await getUserProxyContract(user);
  return userProxyContract.isAuth(GELATO_CORE);
}

export const userHaveETHAVault = async (user) => {
  return await getVault(user, "ETH-A") !== undefined;
}

export const userHaveETHBVault = async (user) => {
  return await getVault(user, "ETH-B") !== undefined;
}

export const getVault = async (user, colType) => {
  const signer = await user.getSigner();
  const userAddr = await signer.getAddress();
  const makerResolverContract = new ethers.Contract(
    MAKER_RESOLVER_ADDR,
    ["function getVaults(address owner) view returns (VaultData[] memory)"],
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