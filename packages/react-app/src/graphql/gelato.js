import { gql } from "apollo-boost";

const GET_TASK_RECEIPT_WRAPPERS = gql`
  query taskReceiptWrapper($skip: Int, $proxyAddress: String!) {
    taskReceiptWrappers(
      where: { user: $proxyAddress }
      first: 100
      skip: $skip
      orderBy: id
      orderDirection: desc
    ) {
      id
      taskReceipt {
        id
        userProxy
        provider {
          addr
          module
        }
        index
        tasks {
          conditions {
            inst
            data
          }
          actions {
            addr
            data
            operation
            dataFlow
            value
            termsOkCheck
          }
          selfProviderGasLimit
          selfProviderGasPriceCeil
        }
        expiryDate
        cycleId
        submissionsLeft
      }
      submissionHash
      status
      submissionDate
      executionDate
      executionHash
      selfProvided
    }
  }
`;

export default GET_TASK_RECEIPT_WRAPPERS;
