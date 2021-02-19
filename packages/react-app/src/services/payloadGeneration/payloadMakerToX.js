import { getUserProxyContract } from './../stateReads';
import { addresses, abis } from "@project/contracts";
import { abiEncodeWithSelector } from "../../utils/helpers";
import { Operation, Condition, Action, Task, GelatoProvider } from "@gelatonetwork/core";
import { ETH } from "../../utils/constants";
import { ethers } from 'ethers';

const {
    OSM,
    CONDITION_MAKER_VAULT_UNSAFE_OSM,
    CONDITION_CAN_DO_REFINANCE,
    CONNECT_GELATO_DATA_MAKER_TO_X,
    GELATO_PROVIDER,
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
    //#region Condition Vault is Safe
    const conditionMakerVaultUnsafeObj = new Condition({
      inst: CONDITION_MAKER_VAULT_UNSAFE_OSM,
      data: await abiEncodeWithSelector({
        abi: [
          "function isVaultUnsafeOSM(uint256 _vaultId, address _priceOracle, bytes _oraclePeekPayload, bytes _oraclePeepPayload, uint256 _minPeek, uint256 _minPeep) view returns (string)",
        ],
        functionname: "isVaultUnsafeOSM",
        inputs: [
            vaultAId,
            OSM,
            await abiEncodeWithSelector({
              abi: ["function peek() view returns (bytes32,bool)"],
              functionname: "peek",
            }),
            await abiEncodeWithSelector({
                abi: ["function peep() view returns (bytes32,bool)"],
                functionname: "peep",
            }),
            ethers.utils.parseUnits("151", 16),
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

    //#endregion Debt Bridge Task Creation

    //#region Gelato Connector call cast

    const gelatoExternalProvider = new GelatoProvider({
      addr: GELATO_PROVIDER, // Gelato Provider Address
      module: PROVIDER_DSA_MODULE_ADDR, // Gelato DSA module
    });

    return await abiEncodeWithSelector({
      abi: ConnectGelato,
      functionname: "submitTask",
      inputs: [gelatoExternalProvider, debtBridgeTask, 0],
    });

    //#endregion Gelato Connector call cast
  };