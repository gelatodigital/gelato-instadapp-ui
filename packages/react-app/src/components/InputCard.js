import React, { useState } from "react";
import { ViewCard } from "../components";
import { dsProxyExecTx } from "../services/stateWrites";

export const InputCard = ({
  title,
  btnText,
  setInputs,
  defaultValue,
  inputs,
  execFunc,
}) => {
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const newValue = event.target.value;
    setInputs({
      ...inputs,
      [title]: newValue,
    });
  };

  const handleExec = async () => {
    // Exec Transaction
    setLoading(true);
    try {
      await execFunc();
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  return (
    <ViewCard>
      <p>{`${title}`}</p>
      <input
        style={{ maxWidth: "80%" }}
        type="text"
        value={inputs[title]}
        onChange={handleChange}
        defaultValue={defaultValue}
      />
      {!loading && (
        <input
          style={{ marginTop: "8px" }}
          type="submit"
          onClick={handleExec}
          value={btnText}
        />
      )}
      {loading && <p>waiting...</p>}
    </ViewCard>
  );
};

export default InputCard;
