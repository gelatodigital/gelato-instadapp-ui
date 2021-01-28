import { getUserProxyContract } from './../stateReads';
import { addresses, abis } from "@project/contracts";
import { abiEncodeWithSelector } from "../../utils/helpers";
import { Operation, Condition, Action, Task, GelatoProvider } from "@gelatonetwork/core";
import { ETH } from "../../utils/constants";
import {getTaskHash} from "./payloadMaker";

const {
    OSM,
    CONDITION_MAKER_VAULT_UNSAFE_OSM,
    CONDITION_MAKER_TO_AAVE_SAFE,
    CONDITION_MAKER_TO_AAVE_LIQUID,
    CONNECT_GELATO_DATA_MAKER_TO_AAVE,
    EXTERNAL_PROVIDER_ADDR,
    PROVIDER_DSA_MODULE_ADDR
  } = addresses;

const { ConnectGelato } = abis;


export const submitRefinanceMakerToAave = async (
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
          "function isVaultUnsafeOSM(uint256 _vaultId, address _priceOracle, bytes calldata _oraclePayload, uint256 _minColRatio) view returns (string)",
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

    //#region futur Aave position will be safe

    const conditionAavePositionWillBeSafeObj = new Condition({
        inst: CONDITION_MAKER_TO_AAVE_SAFE,
        data: await abiEncodeWithSelector({
            abi: [
                "function aavePositionWillBeSafe(address _dsa, uint256 _fromVaultId, address _colToken) view returns (string memory)"
            ],
            functionname: "aavePositionWillBeSafe",
            inputs: [
                userProxy.address,
                vaultAId,
                ETH
            ],
        }),
      });

    //#endregion futur Aave position will be safe

    //#region Aave has enough liquidity

    const conditionAaveHasLiquidityObj = new Condition({
        inst: CONDITION_MAKER_TO_AAVE_LIQUID,
        data: await abiEncodeWithSelector({
            abi: [
                "function hasLiquidity(uint256 _fromVaultId) view returns (string memory)"
            ],
            functionname: "hasLiquidity",
            inputs: [vaultAId],
        }),
      });

    //#endregion Aave has enough liquidity
  
    //#region Action Call Connector For Full Refinancing
  
    const debtBridgeCalculationForFullRefinanceAction = new Action({
      addr: CONNECT_GELATO_DATA_MAKER_TO_AAVE,
      data: await abiEncodeWithSelector({
        abi: [
          "function getDataAndCastMakerToAave(uint256 _vaultId, address _colToken) payable",
        ],
        functionname: "getDataAndCastMakerToAave",
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
        conditionAavePositionWillBeSafeObj,
        conditionAaveHasLiquidityObj
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