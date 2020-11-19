import React, { useCallback, useEffect, useState } from "react";
import { Web3Provider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";
import User from "./pages/User";
import SubmitTask from "./pages/SubmitTask";
import DeployProxy from "./pages/DeployProxy";
import TaskOverview from "./pages/TaskOverview";
import ethers from "ethers";
import GelatoLogo from "./components/Logo";

import { Body, Button, Header, HyperLink, CardWrapper } from "./components";

import { web3Modal, logoutOfWeb3Modal } from "./utils/web3Modal";

import GET_TRANSFERS from "./graphql/subgraph";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";

import { getUserProxy } from "./services/stateReads";

function WalletButton({ userAccount, loadWeb3Modal }) {
  return (
    <Button
      onClick={() => {
        if (!userAccount) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
      }}
    >
      {!userAccount ? "Connect Wallet" : "Disconnect Wallet"}
    </Button>
  );
}

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [userAccount, setUserAccount] = useState();
  const [hasProxy, setHasProxy] = useState();
  const [proxyAddress, setProxyAddress] = useState();

  /* Open wallet selection modal. */
  const loadWeb3Modal = useCallback(async () => {
    const newuserAccount = await web3Modal.connect();
    //console.log((new ethers.providers.Web3Provider(newuserAccount)).getSigner());
    setUserAccount(new Web3Provider(newuserAccount));
  }, []);

  const checkIfUserHasProxy = async (userAccount) => {
    const proxyAddress = await getUserProxy(userAccount);
    if (
      ethers.utils.getAddress(proxyAddress) ===
      ethers.utils.getAddress(ethers.constants.AddressZero)
    )
      setHasProxy(false);
    else {
      setHasProxy(true);
      setProxyAddress(proxyAddress);
    }
  };

  /* If user has loaded a wallet before, load it automatically. */
  useEffect(() => {
    if (web3Modal.cacheduserAccount) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  // Check if user deployed Proxy
  useEffect(() => {
    if (userAccount) {
      checkIfUserHasProxy(userAccount);
    }
  });

  return (
    <div>
      <Router>
        <Header>
          <div
            className="gelato-logo"
            onClick={() => {
              console.log("Gelatino");
            }}
          >
            <GelatoLogo></GelatoLogo>
          </div>
          {userAccount && hasProxy && (
            <>
              <HyperLink>
                <Link style={{ color: "white", textDecoration: "none" }} to="/">
                  User
                </Link>
              </HyperLink>
              <HyperLink>
                <Link
                  style={{ color: "white", textDecoration: "none" }}
                  to="/submit-task"
                >
                  Submit Task
                </Link>
              </HyperLink>
              <HyperLink>
                <Link
                  style={{ color: "white", textDecoration: "none" }}
                  to="/task-overview"
                >
                  Task Overview
                </Link>
              </HyperLink>
            </>
          )}
          <WalletButton
            userAccount={userAccount}
            loadWeb3Modal={loadWeb3Modal}
          />
        </Header>
        <Body>
          <Switch>
            {!userAccount && !hasProxy && (
              <Route path="/">
                <CardWrapper>
                  <h3 style={{ color: "#4299e1" }}>Please login</h3>
                </CardWrapper>
              </Route>
            )}
            {userAccount && !hasProxy && (
              <Route path="/">
                <DeployProxy
                  setHasProxy={setHasProxy}
                  userAccount={userAccount}
                ></DeployProxy>
              </Route>
            )}
            {userAccount && hasProxy && (
              <>
                <Route path="/submit-task">
                  <SubmitTask userAccount={userAccount}></SubmitTask>
                </Route>
                <Route path="/task-overview">
                  {userAccount && hasProxy && proxyAddress && (
                    <TaskOverview
                      userAccount={userAccount}
                      userProxyAddress={proxyAddress}
                    ></TaskOverview>
                  )}
                </Route>
                <Route exact path="/">
                  <User userAccount={userAccount}></User>
                </Route>

                {/*Redirect all 404's to home*/}
                <Redirect to="/" />
              </>
            )}
          </Switch>
        </Body>
      </Router>
    </div>
  );
}

export default App;
