import React, { useState } from "react";
import { CardWrapper, Button } from "../components";

import { deployProxyAction } from "../services/stateWrites";

const DeployProxy = ({ userAccount, setHasProxy }) => {
  const [loading, setLoading] = useState(false);

  return (
    <>
      <CardWrapper>
        {!loading && (
          <Button
            onClick={async () => {
              setLoading(true);
              try {
                await deployProxyAction(userAccount);
                setLoading(false);
                setHasProxy(true);
              } catch (error) {
                setLoading(false);
              }
            }}
          >
            Deploy Proxy
          </Button>
        )}
        {loading && <p style={{ color: "#4299e1" }}>waiting...</p>}
      </CardWrapper>
    </>
  );
};

export default DeployProxy;
