import React, { useState, useEffect } from "react";
import ethers from "ethers";
import { CardWrapper } from "../components";
import InputCard from "../components/InputCard";
import ViewCardWrapper from "../components/ViewCardWrapper";
import ViewCardButton from "../components/ViewCardButton";
import {
  getMiniUserAddress,
  getUserProxy,
  userHaveETHAVault,
  userHaveETHBVault,
  getVault,
  gelatoIsAuth,
} from "../services/stateReads";
import { getMiniAddress } from "../utils/helpers";
import { userProxyCast } from "../services/stateWrites";
import { addresses } from "@project/contracts";
import {
  openMakerVault,
  depositMakerVault,
  borrowMakerVault,
  authorizeGelato
} from "../services/payloadGeneration";
const { CONNECT_MAKER_ADDR, CONNECT_GELATO_ADDR} = addresses;

const User = ({ userAccount }) => {
  const [inputs, setInputs] = useState({});

  const inputsUpdates = async () => {
    const miniUserAddress = await updateUserAddress();
    const userProxyAddress = await updateDsProxyAddress();
    const userProxyHasVaultA = await userHaveETHAVault(userAccount);
    const userProxyHasVaultB = await userHaveETHBVault(userAccount);
    const gelatoHasRight = await gelatoIsAuth(userAccount);

    setInputs({
      ...inputs,
      dsProxyAddress: userProxyAddress,
      userAddress: miniUserAddress,
      vaultAExist: userProxyHasVaultA,
      vaultBExist: userProxyHasVaultB,
      gelatoHasRight : gelatoHasRight,
    });
  };

  const updateDsProxyAddress = async () => {
    const proxyAddress = await getUserProxy(userAccount);
    return getMiniAddress(proxyAddress);
  };

  const updateUserAddress = async () => {
    return await getMiniUserAddress(userAccount);
  };
  const openVaultA = async () => {
     if(userHaveETHAVault(userAccount)) return;

     const data = await openMakerVault(userAccount, "ETH-A");
     await userProxyCast([CONNECT_MAKER_ADDR], [data], userAccount);
     setInputs({...inputs,
      vaultAExist: true,
    })
  };

  const openVaultB = async () => {
    if(userHaveETHBVault(userAccount)) return;

    const data = await openMakerVault(userAccount, "ETH-B");
     await userProxyCast([CONNECT_MAKER_ADDR], [data], userAccount);
     setInputs({...inputs,
      vaultBExist: true,
    })
  }

  const depositVaultA = async () => {
    const value = inputs["Deposit Col for ETH-A Vault"];

    const valueInWei = ethers.utils.parseEther(value);
    const vault = await getVault(userAccount, "ETH-A");
    const vaultId = vault !== undefined ? vault.id : 0;
    const data = await depositMakerVault(userAccount, valueInWei, vaultId);

    await userProxyCast([CONNECT_MAKER_ADDR], [data], userAccount);
  }

  const borrowVaultA = async () => {
    const value = inputs["Borrow DAI from ETH-A Vault"];

    const valueInWei = ethers.utils.parseEther(value);
    const vault = await getVault(userAccount, "ETH-A");
    const vaultId = vault !== undefined ? vault.id : 0;
    const data = await borrowMakerVault(userAccount, valueInWei, vaultId);

    await userProxyCast([CONNECT_MAKER_ADDR], [data], userAccount);
  }

  const authorizeGelatoAction = async () => {
    const data = await authorizeGelato(userAccount);

    await userProxyCast([CONNECT_GELATO_ADDR], [data], userAccount);

    setInputs({...inputs,
      gelatoHasRight: true,
    })
  }

  useEffect(() => {
    inputsUpdates();
  }, [inputs.gelatoBalance]);

  return (
    <>
      <CardWrapper>
        <ViewCardWrapper
            title="User Address"
            state={inputs.userAddress}
          ></ViewCardWrapper>
          <ViewCardWrapper
            title="Proxy Address"
            state={inputs.dsProxyAddress}
          ></ViewCardWrapper>
          <ViewCardWrapper
            title="Proxy Address"
            state={inputs.dsProxyAddress}
          ></ViewCardWrapper>
        </CardWrapper>
      <CardWrapper>
        {!inputs.vaultAExist &&
          (<ViewCardButton
            title="Create ETH-A Vault"
            action={openVaultA}
          >
          </ViewCardButton>)
        }
        {inputs.vaultAExist && (
            <InputCard
            title="Deposit Col for ETH-A Vault"
            btnText="Deposit"
            setInputs={setInputs}
            inputs={inputs}
            execFunc={depositVaultA}
            ></InputCard>
        )}
        {inputs.vaultAExist && (
            <InputCard
            title="Borrow DAI from ETH-A Vault"
            btnText="Borrow"
            setInputs={setInputs}
            inputs={inputs}
            execFunc={borrowVaultA}
            ></InputCard>
        )}
      </CardWrapper>
      <CardWrapper>
        {!inputs.vaultBExist &&
            (<ViewCardButton
              title="Create ETH-B Vault"
              action={openVaultB}
            >
            </ViewCardButton>)
        }
      </CardWrapper>
      <CardWrapper>
        {!inputs.gelatoHasRight &&
            (<ViewCardButton
              title="Authorize Gelato"
              action={authorizeGelatoAction}
            >
            </ViewCardButton>)
        }
      </CardWrapper>
    </>
  );
};

export default User;
