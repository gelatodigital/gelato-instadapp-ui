import React, { useMemo, useState, useEffect } from "react";
import ethers from "ethers";
import { HyperLink, ViewCard, CardWrapper, ButtonBlue } from "../components";
import { addresses, abis } from "@project/contracts";
import { useTable, useSortBy } from "react-table";
// Styled components
import styled from "styled-components";
// Graph QL Query
import { useQuery } from "@apollo/react-hooks";
import GET_TASK_RECEIPT_WRAPPERS from "../graphql/gelato";
import { getCancelTaskData } from "../services/payloadGeneration";
// import { dsProxyExecTx } from "../services/stateWrites";
import { isKnownTask, sleep } from "../utils/helpers";
const { CONDITION_VAULT_IS_SAFE_ADDR, CONDITION_DEBT_BRIDGE_AFFORDABLE_ADDR } = addresses;

const Styles = styled.div`
  padding: 1rem;
  font-size: 1rem;
  color: black;

  table {
    border-spacing: 0;
    border: 2px solid #4299e1;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      text-align: center;
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid #4299e1;
      border-right: 1px solid #4299e1;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

const TaskOverview = ({ provider, userProxyAddress }) => {
  const { loading, error, data, refetch, fetchMore } = useQuery(
    GET_TASK_RECEIPT_WRAPPERS,
    {
      variables: {
        skip: 0,
        proxyAddress: userProxyAddress.toLowerCase(),
      },
    }
  );

  const [rowData, setRowData] = useState([
    {
      id: "",
      user: "",
      status: "",
      submitDate: "",
      limit: "",
      feeratio: "",
      execDate: "",
      execLink: "",
    },
  ]);

  const columns = useMemo(
    () => [
      {
        Header: "#",
        accessor: "id", // accessor is the "key" in the data
      },

      {
        Header: "Task Status",
        accessor: "status",
      },
      {
        Header: "Submit Link",
        accessor: "submitDate",
      },
      {
        Header: "Refinance Triggers Limit",
        accessor: "limit",
      },
      {
        Header: "Maximum Fees in Col Percent",
        accessor: "feeratio",
      },
      {
        Header: "Exec Date",
        accessor: "execDate",
      },
      {
        Header: "Exec Link",
        accessor: "execLink",
      },
      {
        Header: "Cancel Task",
        accessor: "cancel",
      },
    ],
    []
  );

  const decodeAffordableRatio = async (data) => {
    return String(((ethers.utils.RLP.decode(data))[1]).div(ethers.utils.parseUnits("1", 18)));
  }

  const decodeVaultUnsafe = async (data) => {
    return String(((ethers.utils.RLP.decode(data))[3]).div(ethers.utils.parseUnits("1", 18)));
  }

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: rowData }, useSortBy);

  const createRowData = (provider, data) => {
    const newRows = [];
    // Filter all tasks by known Tash Hashes
    for (let wrapper of data.taskReceiptWrappers) {
      if (!isKnownTask(wrapper.taskReceipt.tasks[wrapper.taskReceipt.index]))
        continue;

      const execUrl = `https://etherscan.io/tx/${wrapper.executionHash}`;
      const submitUrl = `https://etherscan.io/tx/${wrapper.submissionHash}`;
      newRows.push({
        id: parseInt(wrapper.id),
        status: wrapper.status,
        submitDate: (
          <a target="_blank" href={submitUrl}>
            Link
          </a>
        ),
        limit: decodeVaultUnsafe(wrapper.taskReceipt.tasks.conditions[0].data),
        feeratio: decodeAffordableRatio(wrapper.taskReceipt.tasks.conditions[1].data),
        execDate:
          wrapper.executionDate !== null
            ? new Date(wrapper.executionDate * 1000)
                .toLocaleDateString()
                .toString()
            : "",
        execLink:
          wrapper.status !== "awaitingExec" ? (
            <a target="_blank" href={execUrl}>
              Link
            </a>
          ) : (
            ""
          ),
        cancel:
          wrapper.status === "awaitingExec" ? (
            <>
              <button
                style={{
                  borderColor: "white",
                  color: "white",
                  backgroundColor: "#4299e1",
                }}
                onClick={async () => {
                  // const cancelTaskData = getCancelTaskData(wrapper.taskReceipt);
                  // try {
                  //   await dsProxyExecTx(
                  //     provider,
                  //     GELATO_HANDLER,
                  //     cancelTaskData,
                  //     0 // value
                  //   );
                  // } catch (err) {
                  //   console.log(err);
                  // }
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            ""
          ),
      });
    }
    return newRows;
  };

  useEffect(() => {
    if (data) {
      const newRows = createRowData(provider, data);
      if (newRows.length > 0) setRowData(newRows);
    }
  }, [data]);

  if (loading) return <p>Loading...</p>;
  if (error)
    return <p>Error fetching Gelato Subgraph, please refresh the page :)</p>;
  return (
    <>
      <CardWrapper style={{ maxWidth: "100%" }}>
        <Styles>
          <table {...getTableProps()}>
            <thead>
              {// Loop over the header rows
              headerGroups.map((headerGroup) => (
                // Apply the header row props
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {// Loop over the headers in each row
                  headerGroup.headers.map((column) => (
                    // Apply the header cell props
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                    >
                      {// Render the header
                      column.render("Header")}
                      <span>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? " 🔽"
                            : " 🔼"
                          : ""}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {/* Apply the table body props */}
            <tbody {...getTableBodyProps()}>
              {// Loop over the table rows
              rows.map((row) => {
                // Prepare the row for display
                prepareRow(row);
                return (
                  // Apply the row props
                  <tr {...row.getRowProps()}>
                    {// Loop over the rows cells
                    row.cells.map((cell) => {
                      // Apply the cell props
                      return (
                        <td {...cell.getCellProps()}>
                          {// Render the cell contents
                          cell.render("Cell")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Styles>
        <ButtonBlue
          onClick={async () => {
            refetch();
            setRowData([
              {
                id: "",
                status: "",
                submitDate: "",
                limit: "",
                feeratio: "",
                execDate: "",
                execLink: "",
                cancel: "",
              },
            ]);
            await sleep(1000);
            setRowData(createRowData(provider, data));
          }}
        >
          Refresh
        </ButtonBlue>
      </CardWrapper>
    </>
  );
};

export default TaskOverview;
