import ethers from "ethers";
import { addresses, abis } from "@project/contracts";
import { abiEncodeWithSelector } from "../utils/helpers";
import {
  Operation,
  Condition,
  Action,
  Task
} from "@gelatonetwork/core";
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
  ConnectGelatoDataFullRefinanceMaker,
  ConditionMakerVaultUnsafe,
  ConditionDebtBridgeIsAffordable,
  PriceOracleResolver,
  ConnectMaker,
  ConnectAuth 
} = abis;

export const openMakerVault = async (user, colType) => {
  return await abiEncodeWithSelector({
    abi: ConnectMaker.abi,
    functionname: "open",
    inputs: [colType]
  });
}

export const depositMakerVault = async (user,value, vaultId) => {
  return await abiEncodeWithSelector({
    abi: ConnectMaker.abi,
    functionname: "deposit",
    inputs: [vaultId, value, 0, 0]
  });
}

export const borrowMakerVault = async (user, value, vaultId) => {
  return await abiEncodeWithSelector({
    abi: ConnectMaker.abi,
    functionname: "borrow",
    inputs: [vaultId, value, 0, 0]
  });
}

export const authorizeGelato = async (user) => {
  return await abiEncodeWithSelector({
    abi: ConnectAuth.abi,
    functionname: "add",
    inputs: [GELATO_CORE]
  });
}

export const submitRefinanceMakerToMaker = async (user, ratio, limit, vaultAId, vaultBId) => {
  const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // For Demo purpose.
  const signer = await user.getSigner();
  const userAddr = await signer.getAddress();

  //#region Condition Vault is Safe

  const conditionVaultIsSafeContract = new ethers.Contract(CONDITION_VAULT_IS_SAFE_ADDR,
    ConditionMakerVaultUnsafe.abi,
    signer
    );
  
  const conditionMakerVaultUnsafeObj = new Condition({
    inst: CONDITION_VAULT_IS_SAFE_ADDR,
    data: await conditionVaultIsSafeContract.getConditionData(
      vaultAId, PRICE_ORACLE_ADDR,
      await abiEncodeWithSelector({
        abi: PriceOracleResolver.abi,
        functionname: "getMockPrice",
        inputs: [userAddr]
      }),
      limit
    )
  });

  //#endregion Condition Vault is Safe

  //#region Condition Debt Bridge is Affordable

  const conditionDebtBridgeIsAffordableContract = new ethers.Contract(CONDITION_DEBT_BRIDGE_AFFORDABLE_ADDR,
    ConditionDebtBridgeIsAffordable.abi,
    signer
    );
  
  const conditionDebtBridgeIsAffordableObj = new Condition({
    inst: CONDITION_DEBT_BRIDGE_AFFORDABLE_ADDR,
    data: await conditionDebtBridgeIsAffordableContract.getConditionData(vaultAId, ratio)
  });

  //#endregion Condition Debt Bridge is Affordable

  //#region Action Call Connector For Full Refinancing

  const debtBridgeCalculationForFullRefinanceAction = new Action({
    addr: CONNECT_FULL_REFINANCE_ADDR,
    data: await abiEncodeWithSelector({
      abi : ConnectGelatoDataFullRefinanceMaker.abi,
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

  //#endregion Debt Bridge Task Creation

  //#region Gelato Connector call cast

  const gelatoExternalProvider = new GelatoCoreLib.GelatoProvider({
    addr: EXTERNAL_PROVIDER_ADDR, // Gelato Provider Address
    module: PROVIDER_DSA_MODULE_ADDR, // Gelato DSA module
  });

  return await abiEncodeWithSelector({
    abi: ConnectGelato.abi,
    functionname: "submitTask",
    inputs: [
      gelatoExternalProvider,
      debtBridgeTask,
      0
    ],
  })

  //#endregion Gelato Connector call cast
}

export const getCancelTaskData = async (taskReceipt) => {
  const iGelatoHandler = new ethers.utils.Interface([
    "function multiCancelTasks(tuple(uint256 id, address userProxy, tuple(address addr, address module) provider, uint256 index, tuple(tuple(address inst, bytes data)[] conditions, tuple(address addr, bytes data, uint8 operation, uint8 dataFlow, uint256 value, bool termsOkCheck)[] actions, uint256 selfProviderGasLimit, uint256 selfProviderGasPriceCeil)[] tasks, uint256 expiryDate, uint256 cycleId, uint256 submissionsLeft)[] _TasksToCancel)",
  ]);
  return iGelatoHandler.encodeFunctionData("multiCancelTasks", [[taskReceipt]]); // array of taskReceipts
};
