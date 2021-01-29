import React, { useState, useEffect } from "react";
import ethers from "ethers";
import { ViewCard, CardWrapper, Button } from "../components";
import { getVault, getUserProxy } from "../services/stateReads";
import { userProxyCast } from "../services/stateWrites";
import { addresses } from "@project/contracts";
import { submitRefinanceMakerToCompound } from "../services/payloadGeneration/payloadMakerToCompound";
const { CONNECT_GELATO_ADDR } = addresses;

const SubmitTask = ({ userAccount }) => {
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({});
  const [limit, setLimit] = useState();

  const inputsUpdates = async () => {
    const userProxy = await getUserProxy(userAccount);
    const vA = await getVault(userAccount, userProxy, "ETH-A");
    const vAId = vA !== undefined ? vA.id : 0;

    setInputs({
      ...inputs,
      vaultAId: vAId,
      defaultValue: 0,
    });
  };

  const handleLimitChange = async (event) => {
    const newValue = event.target.value;
    setLimit(newValue);
  };

  const submit = async () => {
    if (limit === 0) return;
    if (parseInt(inputs.vaultAId) === 0) return;

    const data = await submitRefinanceMakerToCompound(
      userAccount,
      ethers.utils.parseUnits(String(parseFloat(limit) / 100), 18),
      inputs.vaultAId
    );

    await userProxyCast([CONNECT_GELATO_ADDR], [data], userAccount, 0, 350000);
  };

  useEffect(() => {
    inputsUpdates();
  });

  return (
    <>
      <CardWrapper>
        <ViewCard>
          <label style={{ margin: "10px" }}>
            Collateralization Ratio that should trigger the refinance as %
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
            <Button
              onClick={async () => {
                setLoading(true);
                try {
                  await submit();
                  setLoading(false);
                } catch {
                  setLoading(false);
                }
              }}
            >
              Submit Compound Task
            </Button>
          )}
          {loading && <p>waiting...</p>}
        </ViewCard>
      </CardWrapper>
    </>
  );
};

export default SubmitTask;
