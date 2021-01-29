import ethers from "ethers";
import { abiEncodeWithSelector } from "../../utils/helpers";
import { addresses } from "@project/contracts";
const {GELATO_CORE} = addresses;

export const openMakerVault = async (colType) => {
    return await abiEncodeWithSelector({
      abi: ["function open(string colType) payable returns (uint)"],
      functionname: "open",
      inputs: [colType],
    });
};

export const depositMakerVault = async (value, vaultId) => {
    return await abiEncodeWithSelector({
      abi: [
        "function deposit(uint vault, uint amt, uint getId, uint setId) payable",
      ],
      functionname: "deposit",
      inputs: [vaultId, value, 0, 0],
    });
};

export const borrowMakerVault = async (value, vaultId) => {
    return await abiEncodeWithSelector({
      abi: [
        "function borrow(uint vault, uint amt, uint getId, uint setId) payable",
      ],
      functionname: "borrow",
      inputs: [vaultId, value, 0, 0],
    });
};

export const authorizeGelato = async () => {
    return await abiEncodeWithSelector({
      abi: ["function add(address authority) payable "],
      functionname: "add",
      inputs: [GELATO_CORE],
    });
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
        value: parseInt(action.value) === 0 ? false : true,
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
    console.log(taskIdentifier);
  
    return taskIdentifier;
  };
  
  export const getCancelTaskData = async (taskReceipt) => {
    const iGelatoHandler = new ethers.utils.Interface([
      "function multiCancelTasks(tuple(uint256 id, address userProxy, tuple(address addr, address module) provider, uint256 index, tuple(tuple(address inst, bytes data)[] conditions, tuple(address addr, bytes data, uint8 operation, uint8 dataFlow, uint256 value, bool termsOkCheck)[] actions, uint256 selfProviderGasLimit, uint256 selfProviderGasPriceCeil)[] tasks, uint256 expiryDate, uint256 cycleId, uint256 submissionsLeft)[] _TasksToCancel)",
    ]);
    return iGelatoHandler.encodeFunctionData("multiCancelTasks", [[taskReceipt]]); // array of taskReceipts
  };