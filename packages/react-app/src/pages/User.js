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
import { getMiniAddress, getFormattedNumber } from "../utils/helpers";
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
    const vaultADebt = await getFormattedNumber(await getETHAVaultDebt(userAccount, userProxy));
    const vaultALockedCol = await getFormattedNumber(await getETHAVaultCols(userAccount, userProxy));
    const proxyDAIBalance = await getFormattedNumber(await getTokenBalance(userAccount, DAI));

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

  const updateUserAddress = async () => {
    return await getMiniUserAddress(userAccount);
  };

  const openVaultA = async () => {
     if(await userHaveETHAVault(userAccount, inputs.userProxy)) return;

     await userProxyCast([CONNECT_MAKER_ADDR], [await openMakerVault("ETH-A")], userAccount);
     setInputs({...inputs,
      vaultAExist: true,
    })
  };

  const openVaultB = async () => {
    if(await userHaveETHBVault(userAccount, inputs.userProxy)) return;

     await userProxyCast([CONNECT_MAKER_ADDR], [await openMakerVault("ETH-B")], userAccount);
     setInputs({...inputs,
      vaultBExist: true,
    })
  };

  const depositVaultA = async (newValue) => {
    const deposit = newValue;

    const vault = await getVault(userAccount, inputs.userProxy, "ETH-A");
    const vaultId = vault !== undefined ? vault.id : 0;
    const valueOfDeposit = ethers.utils.parseEther(String(deposit));
    const data = await depositMakerVault(valueOfDeposit, vaultId);

    await userProxyCast([CONNECT_MAKER_ADDR], [data], userAccount, valueOfDeposit);
  };

  const borrowVaultA = async (newValue) => {
    const borrow = newValue;

    const vault = await getVault(userAccount, inputs.userProxy, "ETH-A");
    const vaultId = vault !== undefined ? vault.id : 0;
    const data = await borrowMakerVault(ethers.utils.parseEther(borrow), vaultId);

    await userProxyCast([CONNECT_MAKER_ADDR], [data], userAccount);
  };

  const authorizeGelatoAction = async () => {
    await userProxyCast([CONNECT_AUTH], [await authorizeGelato()], userAccount);

    setInputs({...inputs,
      gelatoHasRight: true,
    })
  };

  useEffect(() => {
    inputsUpdates();
  });

  return (
    <>
      {!inputs.gelatoHasRight &&
        (
          <CardWrapper>
            <ViewCardButton
              title="Authorize Gelato"
              action={authorizeGelatoAction}
            >
            </ViewCardButton>
          </CardWrapper>
        )
      }
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
      {!inputs.vaultBExist &&
        (
          <CardWrapper>
                <ViewCardButton
                  title="Create ETH-B Vault"
                  action={openVaultB}
                >
                </ViewCardButton>
          </CardWrapper>
        )
      }
    </>
  );
};

export default User;
