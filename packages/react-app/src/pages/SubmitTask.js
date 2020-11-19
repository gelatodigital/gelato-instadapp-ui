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
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({});
  const [ratio, setRatio] = useState();
  const [limit, setLimit] = useState();

  const inputsUpdates = async () => {
    const userProxy = await getUserProxy(userAccount);
    const vA = await getVault(userAccount, userProxy, "ETH-A");
    const vAId = vA !== undefined ? vA.id : 0;
    const vB = await getVault(userAccount, userProxy, "ETH-B");
    const vBId = vB !== undefined ? vB.id : 0;

    setInputs({
      ...inputs,
      vaultAId: vAId,
      vaultBId: vBId,
      defaultValue: 0
     });
  };

  const handleRatioChange = async (event) => {
    const newValue = event.target.value;
    setRatio(newValue);
  }

  const handleLimitChange = async (event) => {
    const newValue = event.target.value;
    setLimit(newValue);
  }

  const submit = async () => {
    if(ratio === 0) return;
    if(limit === 0) return;
    if(inputs.vaultAId === 0) return;
    
    const data = await submitRefinanceMakerToMaker(userAccount, ethers.utils.parseUnits(String(ratio), 15), ethers.utils.parseUnits(String(limit), 18), inputs.vaultAId, inputs.vaultBId);

    await userProxyCast([CONNECT_GELATO_ADDR], [data], userAccount);
  }

  useEffect(() => {
    inputsUpdates();
  });

  return (
    <>
      <CardWrapper>
      <ViewCard>
        <label style={{ margin: "10px" }}>
          Maximum Fees in Col Percent
        </label>
        
        <input
          style={{ maxWidth: "80%" }}
          type="number"
          value={ratio}
          onChange={handleRatioChange}
          defaultValue={inputs.defaultValue}
        />
      </ViewCard>

      <ViewCard>
        <label style={{ margin: "10px" }}>
          Refinance Triggers Col Ratio in Percent
        </label>

        <input
            style={{ maxWidth: "80%" }}
            type="number"
            value={limit}
            onChange={handleLimitChange}
            defaultValue={inputs.defaultValue}
          />
      </ViewCard>
      
        <ViewCard>
          {!loading && (
              <ButtonBlue onClick={async () => {
                  setLoading(true);
                  try {
                    await submit();
                    setLoading(false);
                  } catch {
                    setLoading(false);
                  }
                }}
              >
                  Submit Task
              </ButtonBlue>
          )}
          {loading && <p>waiting...</p>}
        </ViewCard>
      </CardWrapper>
    </>
  );
};

export default SubmitTask;
