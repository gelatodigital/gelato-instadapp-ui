import ethers from "ethers";
import { addresses } from "@project/contracts";

import { TASK_HASH_X, NEW_TASK_HASH_X } from "./constants";

const { MULTI_SEND, CONNECT_GELATO_DATA_MAKER_TO_X } = addresses;

export const getMiniAddress = (account) => {
  return `${account.substring(0, 6)}...${account.substring(38, 42)}`;
};

export const getGasNowGasPrice = async () => {
  let url = `https://www.gasnow.org/api/v3/gas/price?utm_source=:GELATINO`;
  try {
    const response = await fetch(url);
    const gasNowJson = await response.json();
    return gasNowJson.data.fast;
  } catch (error) {}
};

// operation
// address
// value
// data
export const encodeMultiSend = (transactions, signer) => {
  const multisendAbi = ["function multiSend(bytes transactions) payable"];
  const multiSend = new ethers.Contract(MULTI_SEND, multisendAbi, signer);
  let multiSendData = [];
  transactions.forEach((tx) => {
    const hashedMultiSendData = ethers.utils.solidityPack(
      ["uint8", "address", "uint256", "uint256", "bytes"],
      [
        tx.operation, // Operation
        tx.address, //to
        tx.value, // value
        ethers.utils.hexDataLength(tx.data), // data length
        tx.data, // data
      ]
    );
    multiSendData.push(hashedMultiSendData);
  });

  const hexlifiedData = ethers.utils.hexlify(
    ethers.utils.concat(multiSendData)
  );

  const encodedMultiSendData = multiSend.interface.encodeFunctionData(
    "multiSend",
    [hexlifiedData]
  );

  return encodedMultiSendData;
};

export const getTaskHash = (task) => {
  const conditionsWithoutData = [];
  for (let condition of task.conditions) {
    conditionsWithoutData.push(condition.inst);
  }
  const actionsWithoutData = [];
  for (let action of task.actions) {
    actionsWithoutData.push({
      addr: action.addr,
      operation: parseInt(action.operation),
      dataFlow: parseInt(action.dataFlow),
      value: parseInt(action.value) == 0 ? false : true,
      termsOkCheck: action.termsOkCheck,
    });
  }
  const encodedData = ethers.utils.defaultAbiCoder.encode(
    [
      "address[] conditionAddresses",
      "tuple(address addr, uint8 operation, uint8 dataFlow, bool value, bool termsOkCheck)[] noDataActions",
    ],
    [conditionsWithoutData, actionsWithoutData]
  );

  const taskIdentifier = ethers.utils.keccak256(encodedData);

  return taskIdentifier;
};

// Returns true if task correspons to certain Task Hashes
export const isKnownTask = (task) => {
  const taskHash = getTaskHash(task);
  return (
    taskHash === TASK_HASH_X
    || taskHash === NEW_TASK_HASH_X
    ) ;
};

export const isOldTask = (task) => {
  return (
    getTaskHash(task) === TASK_HASH_X
  );
}

export const sleep = (ms) => {
  return new Promise((resolve) => {
    // console.log(`\n\tSleeping for ${ms / 1000} seconds\n`);
    setTimeout(resolve, ms);
  });
};

export const abiEncodeWithSelector = async (args) => {
  let iface = new ethers.utils.Interface(args.abi);
  return iface.encodeFunctionData(args.functionname, args.inputs);
};

export const getFormattedNumber = async (val) => {
  if (ethers.utils.parseUnits("1", 16).gt(val)) return 0;

  return getFormattedToFixed2(ethers.utils.formatUnits(val, "18"));
};

export const getFormattedToFixed2 = (val) => {
  return parseFloat(val).toFixed(2);
};

export const getABICoder = () => {
  return new ethers.utils.AbiCoder();
};

export const toPercentFormat = (percent) => {
  return getFormattedToFixed2(percent) + "%";
};

export const getDisplayablePercent = (val) => {
  return val
    .mul(ethers.BigNumber.from("100"))
    .div(ethers.utils.parseUnits("1", 18));
}

export const decodeWithoutSignature = (valueTypes, data) => {
  return getABICoder().decode(valueTypes, "0x" + String(data).substring(10));
}

export const isDebtBridgeTask = (action) => {
  return action.addr.toString().toUpperCase() === CONNECT_GELATO_DATA_MAKER_TO_X.toUpperCase();
}