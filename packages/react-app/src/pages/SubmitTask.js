import React, { useState, useEffect } from "react";
import ethers from "ethers";
import {  ViewCard, CardWrapper, ButtonBlue } from "../components";
import {
  getVault
} from "../services/stateReads";
import {
  userProxyCast
} from "../services/stateWrites";
import { addresses } from "@project/contracts";
import {
  submitRefinanceMakerToMaker
} from "../services/payloadGeneration";
const { CONNECT_FULL_REFINANCE_ADDR } = addresses;

const SubmitTask = ({ userAccount }) => {
  const [inputs, setInputs] = useState({});
  // const inputTitles = ["Deposit ETH on Gelato", "Withdraw ETH from Gelato"];
  // const buttonTitles = ["Deposit", "Withdraw"];
  // const addresses = [GELATO_CORE, GELATO_CORE];

  const inputsUpdates = async () => {
    const vA = await getVault(userAccount, "ETH-A");
    const vAId = vA !== undefined ? vA.id : 0;
    const vB = await getVault(userAccount, "ETH-B");
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
    const data = await submitRefinanceMakerToMaker(userAccount, inputs.ratio, inputs.limit, inputs.vaultAId, inputs.vaultBId);

    await userProxyCast([CONNECT_FULL_REFINANCE_ADDR], [data], userAccount);
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
