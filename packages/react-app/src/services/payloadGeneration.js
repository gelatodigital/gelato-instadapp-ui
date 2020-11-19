import ethers from "ethers";
import { addresses, abis } from "@project/contracts";
import { abiEncodeWithSelector } from "../utils/helpers";
import {
  Operation,
  Condition,
  Action,
  Task
} from "@gelatonetwork/core";
import {
  PRICE_ORACLE_MAKER_PAYLOAD,
  ETH
} from "../utils/constants";
const GelatoCoreLib = require("@gelatonetwork/core");
const {
  EXTERNAL_PROVIDER_ADDR,
  PRICE_ORACLE_ADDR,
  CONDITION_VAULT_IS_SAFE_ADDR,
  CONDITION_DEBT_BRIDGE_AFFORDABLE_ADDR,
  CONNECT_FULL_REFINANCE_ADDR,
  PROVIDER_DSA_MODULE_ADDR,
  GELATO_CORE
} = addresses;

const { 
  ConnectGelato,
} = abis;

export const openMakerVault = async (colType) => {
  return await abiEncodeWithSelector({
    abi: [
      "function open(string colType) payable returns (uint)"
    ],
    functionname: "open",
    inputs: [colType]
  });
}

export const depositMakerVault = async (value, vaultId) => {
  return await abiEncodeWithSelector({
    abi: [
      "function deposit(uint vault, uint amt, uint getId, uint setId) payable"
    ],
    functionname: "deposit",
    inputs: [vaultId, value, 0, 0]
  });
}

export const borrowMakerVault = async (value, vaultId) => {
  return await abiEncodeWithSelector({
    abi: [
      "function borrow(uint vault, uint amt, uint getId, uint setId) payable"
    ],
    functionname: "borrow",
    inputs: [vaultId, value, 0, 0]
  });
}

export const authorizeGelato = async () => {
  return await abiEncodeWithSelector({
    abi: [
      "function add(address authority) payable "
    ],
    functionname: "add",
    inputs: [GELATO_CORE]
  });
}

export const submitRefinanceMakerToMaker = async (user, ratioLimit, minColRatio, vaultAId, vaultBId) => {
  const signer = await user.getSigner();

  //#region Condition Vault is Safe

  const conditionVaultIsSafeContract = new ethers.Contract(CONDITION_VAULT_IS_SAFE_ADDR,
    [
      "function getConditionData(uint256 _vaultId, address _priceOracle, bytes _oraclePayload, uint256 _minColRatio) pure returns (bytes)"
    ],
    signer
    );

  const conditionMakerVaultUnsafeObj = new Condition({
    inst: CONDITION_VAULT_IS_SAFE_ADDR,
    data: await conditionVaultIsSafeContract.getConditionData(
      vaultAId, PRICE_ORACLE_ADDR,
      PRICE_ORACLE_MAKER_PAYLOAD,
      minColRatio
    )
  });

  //#endregion Condition Vault is Safe

  //#region Condition Debt Bridge is Affordable

  const conditionDebtBridgeIsAffordableContract = new ethers.Contract(CONDITION_DEBT_BRIDGE_AFFORDABLE_ADDR,
    [
      "function getConditionData(uint256 _vaultId, uint256 _ratioLimit) pure returns (bytes)"
    ],
    signer
    );
  
  const conditionDebtBridgeIsAffordableObj = new Condition({
    inst: CONDITION_DEBT_BRIDGE_AFFORDABLE_ADDR,
    data: await conditionDebtBridgeIsAffordableContract.getConditionData(vaultAId, ratioLimit)
  });

  //#endregion Condition Debt Bridge is Affordable

  //#region Action Call Connector For Full Refinancing

  const debtBridgeCalculationForFullRefinanceAction = new Action({
    addr: CONNECT_FULL_REFINANCE_ADDR,
    data: await abiEncodeWithSelector({
      abi : [
        "function getDataAndCastMakerToMaker(uint256 _vaultAId, uint256 _vaultBId, address _colToken, string _colType) payable"
      ],
      functionname: "getDataAndCastMakerToMaker",
      inputs: [vaultAId, vaultBId, ETH, "ETH-B"]
    }),
    operation: Operation.Delegatecall
  });

  //#endregion Action Call Connector For Full Refinancing

  //#region Debt Bridge Task Creation

  const debtBridgeTask = new Task({
    conditions: [conditionMakerVaultUnsafeObj, conditionDebtBridgeIsAffordableObj],
    actions: [debtBridgeCalculationForFullRefinanceAction]
  });

  //getTaskHash(debtBridgeTask)

  //#endregion Debt Bridge Task Creation

  //#region Gelato Connector call cast

  const gelatoExternalProvider = new GelatoCoreLib.GelatoProvider({
    addr: EXTERNAL_PROVIDER_ADDR, // Gelato Provider Address
    module: PROVIDER_DSA_MODULE_ADDR, // Gelato DSA module
  });

  return await abiEncodeWithSelector({
    abi: ConnectGelato,
    functionname: "submitTask",
    inputs: [
      gelatoExternalProvider,
      debtBridgeTask,
      0
    ],
  })

  //#endregion Gelato Connector call cast
}

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
