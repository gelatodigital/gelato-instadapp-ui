import ethers from "ethers";
import { addresses, abis } from "@project/contracts";
import { abiEncodeWithSelector } from "../utils/helpers";
import { Operation, Condition, Action, Task } from "@gelatonetwork/core";
import { PRICE_ORACLE_MAKER_PAYLOAD, ETH, DAI } from "../utils/constants";
import { getUserProxyContract } from './stateReads';
const GelatoCoreLib = require("@gelatonetwork/core");
const {
  EXTERNAL_PROVIDER_ADDR,
  PRICE_ORACLE_ADDR,
  CONDITION_VAULT_IS_SAFE_ADDR,
  CONDITION_DEBT_VAULT_WILL_BE_SAFE,
  CONDITION_DEBT_BRIDGE_AFFORDABLE_ADDR,
  CONNECT_FULL_REFINANCE_ADDR,
  PROVIDER_DSA_MODULE_ADDR,
  CONDITION_BORROW_AMOUNT_IS_DUST,
  CONDITION_DEBT_CEILING_IS_REACHED,
  GELATO_CORE,
  CONDITION_AAVE_HAS_LIQUIDITY,
  CONDITION_AAVE_POSITION_WILL_BE_SAFE,
  CONNECT_FULL_REFINANCE_ADDR_MAKER_AAVE
} = addresses;

const { ConnectGelato } = abis;

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

export const submitRefinanceMakerToAave = async (
  user,
  ratioLimit,
  minColRatio,
  vaultId) => {
    const userProxy = await getUserProxyContract(user);
    //#region Condition Vault is Safe
  
    const conditionMakerVaultUnsafeObj = new Condition({
      inst: CONDITION_VAULT_IS_SAFE_ADDR,
      data: await abiEncodeWithSelector({
        abi: [
          "function isVaultUnsafe(uint256 _vaultId, address _priceOracle, bytes _oraclePayload, uint256 _minColRatio) view returns (string)",
        ],
        functionname: "isVaultUnsafe",
        inputs: [vaultId, PRICE_ORACLE_ADDR, PRICE_ORACLE_MAKER_PAYLOAD, minColRatio],
      }), 
    });
  
    //#endregion Condition Vault is Safe
  
    //#region Condition Borrow Amount is dust
  
    const conditionAaveHasLiquidityObj = new Condition({
      inst: CONDITION_AAVE_HAS_LIQUIDITY,
      data: await abiEncodeWithSelector({
        abi: [
          "function hasLiquidty(address _tokenToBorrow, uint256 _fromVaultId) view returns (string memory)",
        ],
        functionname: "hasLiquidty",
        inputs: [DAI, vaultId],
      }), 
    })
  
    //#endregion Condition Borrow Amount is dust
  
    //#region Condition Debt Bridge is Affordable
  
    const conditionDebtBridgeIsAffordableObj = new Condition({
      inst: CONDITION_DEBT_BRIDGE_AFFORDABLE_ADDR,
      data: await abiEncodeWithSelector({
        abi: [
          "function isAffordable(uint256 _vaultId, uint256 _ratioLimit) view returns (string)",
        ],
        functionname: "isAffordable",
        inputs: [vaultId, ratioLimit],
      }),
    });
  
    //#endregion Condition Debt Bridge is Affordable
  
    //#region Condition is Vault B Will be Safe
  
    const conditionAavePositionWillBeSafeObj = new Condition({
      inst: CONDITION_AAVE_POSITION_WILL_BE_SAFE,
      data: await abiEncodeWithSelector({
        abi: [
          "function destPositionIsSafe(address _dsa, uint256 _fromVaultId, address _priceOracle, bytes memory _oraclePayload) view returns (string memory)",
        ],
        functionname: "destPositionIsSafe",
        inputs: [userProxy.address, vaultId, PRICE_ORACLE_ADDR, PRICE_ORACLE_MAKER_PAYLOAD],
      }),
    });
  
    //#endregion Condition is Vault B Will be Safe
  
    //#region Action Call Connector For Full Refinancing
  
    const debtBridgeCalculationForFullRefinanceAction = new Action({
      addr: CONNECT_FULL_REFINANCE_ADDR_MAKER_AAVE,
      data: await abiEncodeWithSelector({
        abi: [
          "function getDataAndCastMakerToAave(uint256 _vaultId, address _colToken) payable",
        ],
        functionname: "getDataAndCastMakerToAave",
        inputs: [vaultId, ETH],
      }),
      operation: Operation.Delegatecall,
      termsOkCheck: true,
    });
  
    //#endregion Action Call Connector For Full Refinancing
  
    //#region Debt Bridge Task Creation
  
    const debtBridgeTask = new Task({
      conditions: [
        conditionMakerVaultUnsafeObj,
        conditionDebtBridgeIsAffordableObj,
        conditionAavePositionWillBeSafeObj,
        conditionAaveHasLiquidityObj
      ],
      actions: [debtBridgeCalculationForFullRefinanceAction],
    });
  
    getTaskHash(debtBridgeTask);
  
    //#endregion Debt Bridge Task Creation
  
    //#region Gelato Connector call cast
  
    const gelatoExternalProvider = new GelatoCoreLib.GelatoProvider({
      addr: EXTERNAL_PROVIDER_ADDR, // Gelato Provider Address
      module: PROVIDER_DSA_MODULE_ADDR, // Gelato DSA module
    });
  
    return await abiEncodeWithSelector({
      abi: ConnectGelato,
      functionname: "submitTask",
      inputs: [gelatoExternalProvider, debtBridgeTask, 0],
    });
  
    //#endregion Gelato Connector call cast
  }

export const submitRefinanceMakerToMaker = async (
  user,
  ratioLimit,
  minColRatio,
  vaultAId,
  vaultBId
) => {
  const userProxy = await getUserProxyContract(user);
  //#region Condition Vault is Safe

  const conditionMakerVaultUnsafeObj = new Condition({
    inst: CONDITION_VAULT_IS_SAFE_ADDR,
    data: await abiEncodeWithSelector({
      abi: [
        "function isVaultUnsafe(uint256 _vaultId, address _priceOracle, bytes _oraclePayload, uint256 _minColRatio) view returns (string)",
      ],
      functionname: "isVaultUnsafe",
      inputs: [vaultAId, PRICE_ORACLE_ADDR, PRICE_ORACLE_MAKER_PAYLOAD, minColRatio],
    }), 
  });

  //#endregion Condition Vault is Safe

  //#region Condition Borrow Amount is dust

  const conditionBorrowAmtIsDust = new Condition({
    inst: CONDITION_BORROW_AMOUNT_IS_DUST,
    data: await abiEncodeWithSelector({
      abi: [
        "function isBorrowAmountDust(address _dsa, uint256 _fromVaultId, uint256 _destVaultId, string memory _destColType) view returns (string)",
      ],
      functionname: "isBorrowAmountDust",
      inputs: [userProxy.address, vaultAId, vaultBId, "ETH-B"],
    }), 
  })

  //#endregion Condition Borrow Amount is dust

  //#region Condition Borrow Amount is dust

  const conditionDebtCeilingIsReached = new Condition({
    inst: CONDITION_DEBT_CEILING_IS_REACHED,
    data: await abiEncodeWithSelector({
      abi: [
        "function isDebtCeilingReached(address _dsa, uint256 _fromVaultId, uint256 _destVaultId, string memory _destColType) view returns (string)",
      ],
      functionname: "isDebtCeilingReached",
      inputs: [userProxy.address, vaultAId, vaultBId, "ETH-B"],
    }), 
  })

  //#endregion Condition Borrow Amount is dust

  //#region Condition Debt Bridge is Affordable

  const conditionDebtBridgeIsAffordableObj = new Condition({
    inst: CONDITION_DEBT_BRIDGE_AFFORDABLE_ADDR,
    data: await abiEncodeWithSelector({
      abi: [
        "function isAffordable(uint256 _vaultId, uint256 _ratioLimit) view returns (string)",
      ],
      functionname: "isAffordable",
      inputs: [vaultAId, ratioLimit],
    }),
  });

  //#endregion Condition Debt Bridge is Affordable

  //#region Condition is Vault B Will be Safe

  const conditionIsDestVaultWillBeSafeObj = new Condition({
    inst: CONDITION_DEBT_VAULT_WILL_BE_SAFE,
    data: await abiEncodeWithSelector({
      abi: [
        "function destVaultWillBeSafe(address _dsa, uint256 _fromVaultId, uint256 _destVaultId, string memory _destColType) view returns (string)",
      ],
      functionname: "destVaultWillBeSafe",
      inputs: [userProxy.address, vaultAId, vaultBId, "ETH-B"],
    }),
  });

  //#endregion Condition is Vault B Will be Safe

  //#region Action Call Connector For Full Refinancing

  const debtBridgeCalculationForFullRefinanceAction = new Action({
    addr: CONNECT_FULL_REFINANCE_ADDR,
    data: await abiEncodeWithSelector({
      abi: [
        "function getDataAndCastMakerToMaker(uint256 _vaultAId, uint256 _vaultBId, address _colToken, string _colType) payable",
      ],
      functionname: "getDataAndCastMakerToMaker",
      inputs: [vaultAId, vaultBId, ETH, "ETH-B"],
    }),
    operation: Operation.Delegatecall,
    termsOkCheck: true,
  });

  //#endregion Action Call Connector For Full Refinancing

  //#region Debt Bridge Task Creation

  const debtBridgeTask = new Task({
    conditions: [
      conditionMakerVaultUnsafeObj,
      conditionDebtBridgeIsAffordableObj,
      conditionIsDestVaultWillBeSafeObj,
      conditionBorrowAmtIsDust,
      conditionDebtCeilingIsReached
    ],
    actions: [debtBridgeCalculationForFullRefinanceAction],
  });

  getTaskHash(debtBridgeTask);

  //#endregion Debt Bridge Task Creation

  //#region Gelato Connector call cast

  const gelatoExternalProvider = new GelatoCoreLib.GelatoProvider({
    addr: EXTERNAL_PROVIDER_ADDR, // Gelato Provider Address
    module: PROVIDER_DSA_MODULE_ADDR, // Gelato DSA module
  });

  return await abiEncodeWithSelector({
    abi: ConnectGelato,
    functionname: "submitTask",
    inputs: [gelatoExternalProvider, debtBridgeTask, 0],
  });

  //#endregion Gelato Connector call cast
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
