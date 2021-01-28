import { getUserProxyContract } from './../stateReads';
import { addresses, abis } from "@project/contracts";
import { abiEncodeWithSelector } from "../../utils/helpers";
import { Operation, Condition, Action, Task, GelatoProvider } from "@gelatonetwork/core";
import {getTaskHash} from "./payloadMaker";

const {
    OSM,
    CONDITION_MAKER_VAULT_UNSAFE_OSM,
    CONDITION_MAKER_TO_MAKER_SAFE,
    CONDITION_MAKER_TO_MAKER_LIQUID,
    CONDITION_DEBT_AMT_IS_DUST,
    CONNECT_GELATO_DATA_MAKER_TO_MAKER,
    EXTERNAL_PROVIDER_ADDR,
    PROVIDER_DSA_MODULE_ADDR
  } = addresses;

const { ConnectGelato } = abis;


export const submitRefinanceMakerToMaker = async (
    user,
    limit,
    vaultAId,
    vaultBId
  ) => {
    const userProxy = await getUserProxyContract(user);
    //#region Condition Vault is Safe
    const conditionMakerVaultUnsafeObj = new Condition({
      inst: CONDITION_MAKER_VAULT_UNSAFE_OSM,
      data: await abiEncodeWithSelector({
        abi: [
          "function isVaultUnsafeOSM(uint256 _vaultId, address _priceOracle, bytes _oraclePayload, uint256 _minColRatio) view returns (string)",
        ],
        functionname: "isVaultUnsafeOSM",
        inputs: [
            vaultAId,
            OSM,
            await abiEncodeWithSelector({
                abi: ["function peep() view returns (bytes32,bool)"],
                functionname: "peep",
            }),
            limit
        ],
      }), 
    });
  
    //#endregion Condition Vault is Safe

    //#region futur Maker position will be safe

    const conditionMakerPositionWillBeSafeObj = new Condition({
        inst: CONDITION_MAKER_TO_MAKER_SAFE,
        data: await abiEncodeWithSelector({
            abi: [
                "function destVaultWillBeSafe(address _dsa, uint256 _fromVaultId, uint256 _destVaultId, string memory _destColType) view returns (string memory)"
            ],
            functionname: "destVaultWillBeSafe",
            inputs: [
                userProxy.address,
                vaultAId,
                vaultBId,
                "ETH-B"
            ],
        }),
      });

    //#endregion futur Maker position will be safe

    //#region Maker has enough liquidity

    const conditionMakerHasLiquidityObj = new Condition({
        inst: CONDITION_MAKER_TO_MAKER_LIQUID,
        data: await abiEncodeWithSelector({
            abi: [
                "function isDebtCeilingReached(address _dsa, uint256 _fromVaultId, uint256 _destVaultId, string memory _destColType) view returns (string memory)"
            ],
            functionname: "isDebtCeilingReached",
            inputs: [
                userProxy.address,
                vaultAId,
                vaultBId,
                "ETH-B"
            ],
        }),
      });

    //#endregion Maker has enough liquidity


    //#region futur debt will be dust check

    const conditionMakerETHBPositionIsDustObj = new Condition({
        inst: CONDITION_DEBT_AMT_IS_DUST,
        data: await abiEncodeWithSelector({
            abi: [
                "function isDebtAmtDust(address _dsa, uint256 _fromVaultId, uint256 _destVaultId, string memory _destColType) view returns (string memory)"
            ],
            functionname: "isDebtAmtDust",
            inputs: [
                userProxy.address,
                vaultAId,
                vaultBId,
                "ETH-B"
            ],
        }),
      });

    //#endregion futur debt will be dust check
  
    //#region Action Call Connector For Full Refinancing
  
    const debtBridgeCalculationForFullRefinanceAction = new Action({
      addr: CONNECT_GELATO_DATA_MAKER_TO_MAKER,
      data: await abiEncodeWithSelector({
        abi: [
          "function getDataAndCastMakerToMaker(uint256 _vaultAId, uint256 _vaultBId, string calldata _colType) payable",
        ],
        functionname: "getDataAndCastMakerToMaker",
        inputs: [vaultAId, vaultBId, "ETH-B"],
      }),
      operation: Operation.Delegatecall,
      termsOkCheck: true,
    });
  
    //#endregion Action Call Connector For Full Refinancing
  
    //#region Debt Bridge Task Creation
  
    const debtBridgeTask = new Task({
      conditions: [
        conditionMakerVaultUnsafeObj,
        conditionMakerPositionWillBeSafeObj,
        conditionMakerHasLiquidityObj,
        conditionMakerETHBPositionIsDustObj
      ],
      actions: [debtBridgeCalculationForFullRefinanceAction],
    });
  
    getTaskHash(debtBridgeTask);
  
    //#endregion Debt Bridge Task Creation
  
    //#region Gelato Connector call cast
  
    const gelatoExternalProvider = new GelatoProvider({
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