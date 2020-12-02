# gelato-example-ui
Example UI to do debt bridge using InstaDapp and Gelato.

## General

This UI is divided in 3 parties (pages) :
- User : authorize gelato connector, open/deposit/borrow an ETH-A vault with the DSA, read deposited collateral amount and amount of DAI borrowed.
- Submit : create a debt bridge task between ETH-A and ETH-B using gelato by inputing the collateralization limit (in percent e.g 300 for 300%) and gas fees limit (in percent e.g 2% for two percent of the collateral locked on ETH-A).
- Task Overview : Monitor submitted task until execution.

## Integration

### payloadGeneration.js

- `submitRefinanceMakerToMaker` function implement the data generation to give to gelato connector for creating a debt bridge task.

### TaskOverview.js

This file monitor what is happening in the Gelato Network by querying the Gelato subgraph, filter informations related to the user DSA and format/decode submitted or executed debt bridge task.


