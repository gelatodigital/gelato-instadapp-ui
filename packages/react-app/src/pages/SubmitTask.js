import React, { useState, useEffect } from "react";
import ethers from "ethers";
import {  ViewCard, CardWrapper, ButtonBlue } from "../components";
import {
  getVault,
  getUserProxy
} from "../services/stateReads";
import {
  userProxyCast
} from "../services/stateWrites";
import { addresses } from "@project/contracts";
import {
  submitRefinanceMakerToMaker
} from "../services/payloadGeneration";
const { CONNECT_GELATO_ADDR } = addresses;

const SubmitTask = ({ userAccount }) => {
  const [inputs, setInputs] = useState({});
  // const inputTitles = ["Deposit ETH on Gelato", "Withdraw ETH from Gelato"];
  // const buttonTitles = ["Deposit", "Withdraw"];
  // const addresses = [GELATO_CORE, GELATO_CORE];

  const inputsUpdates = async () => {
    const userProxy = await getUserProxy(userAccount);
    const vA = await getVault(userAccount, userProxy, "ETH-A");
    const vAId = vA !== undefined ? vA.id : 0;
    const vB = await getVault(userAccount, userProxy, "ETH-B");
    const vBId = vB !== undefined ? vB.id : 0;

    setInputs({
      ...inputs,
      ratio : 0,
      limit : 0,
      vaultAId: vAId,
      vaultBId: vBId,
      defaultValue: 0
     });
  };

  const handleRatioChange = async (event) => {
    const newValue = event.target.value;
    setInputs({
      ...inputs,
      ratio: newValue,
    });
  }

  const handleLimitChange = async (event) => {
    const newValue = event.target.value;
    setInputs({
      ...inputs,
      limit: newValue,
    });
  }

  const submit = async () => {
    if(inputs.ratio === 0) return;
    if(inputs.limit === 0) return;
    if(inputs.vaultAId === 0) return;
    // console.log(String(ethers.utils.parseUnits(String(inputs.ratio), 15)));
    // console.log(String(ethers.utils.parseUnits(String(inputs.limit), 18)));
    // console.log(String(inputs.vaultAId));
    // console.log(String(inputs.vaultBId));
    const data = await submitRefinanceMakerToMaker(userAccount, ethers.utils.parseUnits(String(inputs.ratio), 15), ethers.utils.parseUnits(String(inputs.limit), 18), inputs.vaultAId, inputs.vaultBId);

    await userProxyCast([CONNECT_GELATO_ADDR], [data], userAccount);
  }

  useEffect(() => {
    inputsUpdates();
  }, []);

  return (
    <>
      <CardWrapper>
      <ViewCard>
        <input
          style={{ maxWidth: "80%" }}
          type="text"
          value={inputs.ratio}
          onChange={handleRatioChange}
          defaultValue={inputs.defaultValue}
        />
      </ViewCard>

      <ViewCard>
        <input
            style={{ maxWidth: "80%" }}
            type="text"
            value={inputs.limit}
            onChange={handleLimitChange}
            defaultValue={inputs.defaultValue}
          />
      </ViewCard>
      <ViewCard>
            <ButtonBlue onClick={async () => {await submit();}}>
                Submit Task
            </ButtonBlue>
        </ViewCard>
      </CardWrapper>
    </>
  );
};

export default SubmitTask;
