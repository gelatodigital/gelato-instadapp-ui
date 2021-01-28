import { getUserProxyContract } from './../stateReads';
import { addresses, abis } from "@project/contracts";
import { abiEncodeWithSelector } from "../../utils/helpers";
import { Operation, Condition, Action, Task, GelatoProvider } from "@gelatonetwork/core";
import { ETH } from "../../utils/constants";

import {getTaskHash} from "./payloadMaker";

const {
    OSM,
    CONDITION_MAKER_VAULT_UNSAFE_OSM,
    CONDITION_MAKER_TO_COMPOUND_SAFE,
    CONDITION_MAKER_TO_COMPOUND_LIQUID,
    CONNECT_GELATO_DATA_MAKER_TO_COMPOUND,
    EXTERNAL_PROVIDER_ADDR,
    PROVIDER_DSA_MODULE_ADDR
  } = addresses;

const { ConnectGelato } = abis;



export const submitRefinanceMakerToCompound = async (
    user,
    limit,
    vaultAId
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

    //#region futur Compound position will be safe

    const conditionCompoundPositionWillBeSafeObj = new Condition({
        inst: CONDITION_MAKER_TO_COMPOUND_SAFE,
        data: await abiEncodeWithSelector({
            abi: [
                "function compoundPositionWillBeSafe(address _dsa, uint256 _fromVaultId) view returns (string memory)"
            ],
            functionname: "compoundPositionWillBeSafe",
            inputs: [
                userProxy.address,
                vaultAId
            ],
        }),
      });

    //#endregion futur Compound position will be safe

    //#region Compound has enough liquidity

    const conditionCompoundHasLiquidityObj = new Condition({
        inst: CONDITION_MAKER_TO_COMPOUND_LIQUID,
        data: await abiEncodeWithSelector({
            abi: [
                "function cTokenHasLiquidity(uint256 _fromVaultId) view returns (string memory)"
            ],
            functionname: "cTokenHasLiquidity",
            inputs: [vaultAId],
        }),
      });

    //#endregion Compound has enough liquidity
  
    //#region Action Call Connector For Full Refinancing
  
    const debtBridgeCalculationForFullRefinanceAction = new Action({
      addr: CONNECT_GELATO_DATA_MAKER_TO_COMPOUND,
      data: await abiEncodeWithSelector({
        abi: [
          "function getDataAndCastMakerToCompound(uint256 _vaultId, address _colToken) payable",
        ],
        functionname: "getDataAndCastMakerToCompound",
        inputs: [vaultAId, ETH],
      }),
      operation: Operation.Delegatecall,
      termsOkCheck: true,
    });
  
    //#endregion Action Call Connector For Full Refinancing
  
    //#region Debt Bridge Task Creation
  
    const debtBridgeTask = new Task({
      conditions: [
        conditionMakerVaultUnsafeObj,
        conditionCompoundPositionWillBeSafeObj,
        conditionCompoundHasLiquidityObj
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