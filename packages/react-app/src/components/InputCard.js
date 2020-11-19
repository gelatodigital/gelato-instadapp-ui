import React, { useState } from "react";
import { ViewCard } from "../components";

export const InputCard = ({
  title,
  btnText,
  setInputs,
  defaultValue,
  inputs,
  execFunc,
}) => {
  const [loading, setLoading] = useState(false);
  const [newValue, setNewValue] = useState();

  const handleExec = async () => {
    // Exec Transaction
    setLoading(true);
    try {
      await execFunc(newValue);
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
        type="number"
        value={inputs[title]}
        onChange={(e) => setNewValue(e.target.value)}
      />
      {!loading && (
        <input
          style={{ marginTop: "8px" }}
          type="submit"
          onClick={() => handleExec()}
          value={btnText}
        />
      )}
      {loading && <p>waiting...</p>}
    </ViewCard>
  );
};

export default InputCard;
