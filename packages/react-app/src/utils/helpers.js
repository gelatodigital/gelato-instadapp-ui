import ethers from "ethers";
import { addresses, abis } from "@project/contracts";
import { GelatoCore } from "@gelatonetwork/core";

const { MULTI_SEND, GELATO_CORE, CETH_TO_AETH_REFINANCE_TASK_HASH } = addresses;

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
  return getTaskHash(task) === CETH_TO_AETH_REFINANCE_TASK_HASH;
};

export const sleep = (ms) => {
  return new Promise((resolve) => {
    // console.log(`\n\tSleeping for ${ms / 1000} seconds\n`);
    setTimeout(resolve, ms);
  });
};

export const abiEncodeWithSelector = async (args) => {
  let iface = new ethers.utils.Interface(args.abi);
  return iface.encodeFunctionData(args.functionname, args.inputs)
}
