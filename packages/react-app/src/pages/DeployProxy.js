import React, { useState } from "react";
import { CardWrapper, ButtonBlue } from "../components";

import { deployProxyAction } from "../services/stateWrites";

const DeployProxy = ({ userAccount, setHasProxy }) => {
  const [loading, setLoading] = useState(false);

  return (
    <>
      <CardWrapper>
        {!loading && (
          <ButtonBlue
            onClick={async () => {
              setLoading(true);
              try {
                await deployProxyAction(userAccount);
                setHasProxy(true);
                setLoading(false);
              } catch (error) {
                setLoading(false);
              }
            }}
          >
            Deploy Proxy
          </ButtonBlue>
        )}
        {loading && <p style={{ color: "#4299e1" }}>waiting...</p>}
      </CardWrapper>
    </>
  );
};

export default DeployProxy;
