import { getUserProxyContract } from './../stateReads';
import { addresses, abis } from "@project/contracts";
import { abiEncodeWithSelector } from "../../utils/helpers";
import { Operation, Condition, Action, Task, GelatoProvider } from "@gelatonetwork/core";
import { ETH } from "../../utils/constants";
import {getTaskHash} from "./payloadMaker";

const {
    OSM,
    CONDITION_MAKER_VAULT_UNSAFE_OSM,
    CONDITION_CAN_DO_REFINANCE,
    CONNECT_GELATO_DATA_MAKER_TO_X,
    EXTERNAL_PROVIDER_ADDR,
    PROVIDER_DSA_MODULE_ADDR
  } = addresses;

const { ConnectGelato } = abis;


export const submitRefinanceMakerToX = async (
    user,
    limit,
    vaultAId,
    vaultBId
  ) => {
    const userProxy = await getUserProxyContract(user);
    console.log("TEST");
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

    //#region check if we can do refinance in one of the protocol

    const conditionCanDoRefinanceObj = new Condition({
        inst: CONDITION_CAN_DO_REFINANCE,
        data: await abiEncodeWithSelector({
            abi: [
                "function canDoRefinance(address _dsa, uint256 _fromVaultId, address _colToken, uint256 _destVaultId, string memory _destColType) view returns (string memory)"
            ],
            functionname: "canDoRefinance",
            inputs: [
                userProxy.address,
                vaultAId,
                ETH,
                vaultBId,
                "ETH-B"
            ],
        }),
      });

    //#endregion check if we can do refinance in one of the protocol

    //#region Action Call Connector For Full Refinancing
  
    const debtBridgeCalculationForFullRefinanceAction = new Action({
        addr: CONNECT_GELATO_DATA_MAKER_TO_X,
        data: await abiEncodeWithSelector({
          abi: [
            "function getDataAndCastFromMaker(uint256 _vaultAId, address _colToken, uint256 _vaultBId, string calldata _colType) payable",
          ],
          functionname: "getDataAndCastFromMaker",
          inputs: [vaultAId, ETH, vaultBId, "ETH-B"],
        }),
        operation: Operation.Delegatecall,
        termsOkCheck: true,
      });
    
    //#endregion Action Call Connector For Full Refinancing

    //#region Debt Bridge Task Creation
  
    const debtBridgeTask = new Task({
      conditions: [
        conditionMakerVaultUnsafeObj,
        conditionCanDoRefinanceObj
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