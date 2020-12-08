# Example UI featuring Instadapp x Gelato
Example UI to illustrate how to offer the automated debt bridge use case using InstaDapp and Gelato to Users.

## Run the Reacht App

```
yarn
yarn react-app:start
```

**Note: Mainnet only**

## Tl;dr:  The interesting stuff you will need to integrate:

1) [Enable GelatoCore as an authority on the Users DSA](https://github.com/gelatodigital/gelato-instadapp-ui/blob/aa2f7a1023aed5d4c35a713c9a47a27474f3b578/packages/react-app/src/services/payloadGeneration.js#L49)

2) [Submit the Debt Bridge Task to Gelato via the DSA](https://github.com/gelatodigital/gelato-instadapp-ui/blob/aa2f7a1023aed5d4c35a713c9a47a27474f3b578/packages/react-app/src/services/payloadGeneration.js#L57)

3) [Define the subgraph Query](https://github.com/gelatodigital/gelato-instadapp-ui/blob/aa2f7a1023aed5d4c35a713c9a47a27474f3b578/packages/react-app/src/graphql/gelato.js#L3)

4) [Fetch data from the gelato subgraph](https://github.com/gelatodigital/gelato-instadapp-ui/blob/aa2f7a1023aed5d4c35a713c9a47a27474f3b578/packages/react-app/src/index.js#L12)

5) [Display the status to the user](https://github.com/gelatodigital/gelato-instadapp-ui/blob/aa2f7a1023aed5d4c35a713c9a47a27474f3b578/packages/react-app/src/pages/TaskOverview.js#L141)

6) [Enable Users to cancel the task](https://github.com/gelatodigital/gelato-instadapp-ui/blob/aa2f7a1023aed5d4c35a713c9a47a27474f3b578/packages/react-app/src/services/payloadGeneration.js#L188)


## How to test the automated deb bridge?

1) Deploy a DSA, set Gelato as authority, open an ETH-A Vault (you can also do the first and last part via instadapp.io)

2) Go to the `Submit Task` page and input e.g. 30% as maximum fee of the vaults total dedbt you are willing to pay for tx fee, 160% as the collateralization ratio and then click on `Submit Task`

3) Now check on the `Task Overview` page to see the status of your submitted task. If your Vault's collateralization ratio is not below e.g. 160%, nothing will happen

4) Now draw some DAI from your ETH-A Vault which will lead to your collateralization ratio dropping below 160% (make sure you have more than 500 DAI as debt, otherwise Maker will revert)

5) Wait a minute or so and then check `Task Overview` again to see if Gelato refinanced your debt to an ETH-B vault. If everything worked fine, it should show that the task was successfully executed and present you with the etherscan link.

**Note:** The transaction will not be executed, if Makers ETH-B debt ceiling has been reached!

## Monorepo packacges

1) **contracts**, ABIs and Contract addresses

2) **hardhat**, for some local testing (currently does not support fetching events from the graph)

3) **react-app**, how to integrate Gelato on your UI

4) **subgraph**, how the gelato subgraphs works


## React App: Pages

This React UI is divided in three main pages:


### 1. [User Page](https://github.com/gelatodigital/gelato-instadapp-ui/blob/aa2f7a1023aed5d4c35a713c9a47a27474f3b578/packages/react-app/src/pages/User.js):

User authorizes gelato on its DSA, opens/deposits/borrows an ETH-A vault, reads deposited collateral amount and amount of DAI borrowed.
### 2. [Submit Task Page](https://github.com/gelatodigital/gelato-instadapp-ui/blob/aa2f7a1023aed5d4c35a713c9a47a27474f3b578/packages/react-app/src/pages/SubmitTask.js):

User submits the debt bridge task between ETH-A and ETH-B to Gelato by inputing the collateralization limit (in percent e.g 300 for 300%) and gas fees limit (in percent e.g 2% for two percent of the collateral locked on ETH-A). From that point onwards, Gelato will monitor the Users Vault and execute the debt bridge transaction when the conditions are fulfilled.
### 3. [Task Overview Page](https://github.com/gelatodigital/gelato-instadapp-ui/blob/aa2f7a1023aed5d4c35a713c9a47a27474f3b578/packages/react-app/src/pages/TaskOverview.js):

User can monitor his submitted tasks and determine its status (waiting to be executed, successfully executed, cancelled). This page monitors what is happening in the Gelato Network by querying the Gelato subgraph, filter informations related to the user DSA and format/decode submitted or executed debt bridge task.

