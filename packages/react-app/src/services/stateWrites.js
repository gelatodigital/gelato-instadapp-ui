import ethers from "ethers";
import { addresses } from "@project/contracts";
import { getGasNowGasPrice } from "../utils/helpers";
import { getUserProxyContract } from "./stateReads";

const {
  INSTA_INDEX_ADDR,
} = addresses;

export const deployProxyAction = async (user) => {
  const signer = await user.getSigner();
  const userAddr = await signer.getAddress();
  const instaIndexContract = new ethers.Contract(
    INSTA_INDEX_ADDR,
    [
      "function build(address _owner, uint accountVersion, address _origin) returns (address _account)"
    ],
    signer
  );
  const gasPrice = await getGasNowGasPrice();
  await instaIndexContract.build(userAddr, 1, userAddr,{ gasPrice: gasPrice });
}

export const userProxyCast = async (targets, datas, user, val) => {
  const signer = await user.getSigner();
  const userAddr = await signer.getAddress();
  const userProxy = await getUserProxyContract(user);
  const options = Number(val) === 0 ? {gasLimit: 5000000} : {gasLimit: 5000000, value: val};
  await userProxy.cast(targets, datas, userAddr, options);
}
