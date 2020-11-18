import ethers from "ethers";
import { addresses, abis } from "@project/contracts";
import { getGasNowGasPrice } from "../utils/helpers";
import { getUserProxyContract } from "./stateReads";

const {
  INSTA_INDEX_ADDR,
} = addresses;
const { InstaIndex } = abis;

export const deployProxyAction = async (user) => {
  const signer = await user.getSigner();
  const userAddr = await signer.getAddress();
  const instaIndexContract = new ethers.Contract(
    INSTA_INDEX_ADDR,
    InstaIndex.abi,
    signer
  );
  const gasPrice = await getGasNowGasPrice();
  const tx = await instaIndexContract.build(userAddr, 1, userAddr,{ gasPrice: gasPrice });
  console.log(tx);
  //await tx.wait();
}

export const userProxyCast = async (targets, datas, user, val) => {
  const signer = await user.getSigner();
  const userAddr = await signer.getAddress();
  const userProxy = await getUserProxyContract(user);
  const options = Number(val) === 0 ? {gasLimit: 5000000} : {gasLimit: 5000000, value: val};
  const tx = await userProxy.cast(targets, datas, userAddr, options);
  console.log(tx);
  //await tx.await();
}
