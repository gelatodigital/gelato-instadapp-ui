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
  getTokenBalance,
  getETHAVaultDebt,
  getETHAVaultCols
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
const { CONNECT_MAKER_ADDR, CONNECT_AUTH, DAI} = addresses;

const User = ({ userAccount }) => {
  const [inputs, setInputs] = useState({});

  const inputsUpdates = async () => {
    const miniUserAddress = await updateUserAddress();
    const userProxyAddress = await updateDsProxyAddress();
    const userProxy = await getUserProxy(userAccount);
    const userProxyHasVaultA = await userHaveETHAVault(userAccount, userProxy);
    const userProxyHasVaultB = await userHaveETHBVault(userAccount, userProxy);
    const gelatoHasRight = await gelatoIsAuth(userAccount);
    const vaultADebt = await getDisplayableValue(await getETHAVaultDebt(userAccount, userProxy));
    const vaultALockedCol = await getDisplayableValue(await getETHAVaultCols(userAccount, userProxy));
    const proxyDAIBalance = await getDisplayableValue(await getTokenBalance(userAccount, DAI));

    setInputs({
      ...inputs,
      dsProxyAddress: userProxyAddress,
      userAddress: miniUserAddress,
      vaultAExist: userProxyHasVaultA,
      vaultBExist: userProxyHasVaultB,
      gelatoHasRight: gelatoHasRight,
      dsProxyBalance: proxyDAIBalance,
      dsProxyDebt: vaultADebt,
      dsProxyLockCol: vaultALockedCol,
      userProxy: userProxy
    });
  };

  const updateDsProxyAddress = async () => {
    return getMiniAddress(await getUserProxy(userAccount));
  };

  const getDisplayableValue = async (val) => {
    if(ethers.utils.parseUnits("1", 18).gt(val)) return 0;

    return Number(val.div(ethers.utils.parseUnits("1", 18)));
  }

  const updateUserAddress = async () => {
    return await getMiniUserAddress(userAccount);
  };

  const openVaultA = async () => {
     if(await userHaveETHAVault(userAccount, inputs.userProxy)) return;

     await userProxyCast([CONNECT_MAKER_ADDR], [await openMakerVault(userAccount, "ETH-A")], userAccount);
     setInputs({...inputs,
      vaultAExist: true,
    })
  };

  const openVaultB = async () => {
    if(await userHaveETHBVault(userAccount, inputs.userProxy)) return;

     await userProxyCast([CONNECT_MAKER_ADDR], [await openMakerVault(userAccount, "ETH-B")], userAccount);
     setInputs({...inputs,
      vaultBExist: true,
    })
  };

  const depositVaultA = async (newValue) => {
    const deposit = newValue;

    const vault = await getVault(userAccount, inputs.userProxy, "ETH-A");
    const vaultId = vault !== undefined ? vault.id : 0;
    const valueOfDeposit = ethers.utils.parseEther(String(deposit));
    const data = await depositMakerVault(userAccount, valueOfDeposit, vaultId);

    await userProxyCast([CONNECT_MAKER_ADDR], [data], userAccount, valueOfDeposit);
  };

  const borrowVaultA = async (newValue) => {
    const borrow = newValue;

    const vault = await getVault(userAccount, inputs.userProxy, "ETH-A");
    const vaultId = vault !== undefined ? vault.id : 0;
    const data = await borrowMakerVault(userAccount, ethers.utils.parseEther(borrow), vaultId);

    await userProxyCast([CONNECT_MAKER_ADDR], [data], userAccount);
  };

  const authorizeGelatoAction = async () => {
    await userProxyCast([CONNECT_AUTH], [await authorizeGelato(userAccount)], userAccount);

    setInputs({...inputs,
      gelatoHasRight: true,
    })
  };

  useEffect(() => {
    inputsUpdates();
  });

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
        </CardWrapper>
        <CardWrapper>
        <ViewCardWrapper
            title="Proxy Maker Debt"
            state={inputs.dsProxyDebt}
          ></ViewCardWrapper>
          <ViewCardWrapper
            title="Proxy Maker Locked Col"
            state={inputs.dsProxyLockCol}
          ></ViewCardWrapper>
          <ViewCardWrapper
            title="Proxy DAI Token"
            state={inputs.dsProxyBalance}
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
