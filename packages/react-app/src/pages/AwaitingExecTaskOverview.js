import React, { useMemo, useState, useEffect } from "react";
import { CardWrapper, Button } from "../components";
import { useTable, useSortBy } from "react-table";
// Styled components
import styled from "styled-components";
// Graph QL Query
import { useQuery } from "@apollo/react-hooks";
import GET_ALL_TASK_RECEIPT_WRAPPERS from "../graphql/debtBridgeAllTask";
import {
  isKnownTask,
  isDebtBridgeTask,
  sleep,
  decodeWithoutSignature,
  getDisplayablePercent
} from "../utils/helpers";

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

const AwaitingExecTaskOverview = ({ userAccount, userProxyAddress }) => {
  const { loading, error, data, refetch, fetchMore } = useQuery(
    GET_ALL_TASK_RECEIPT_WRAPPERS,
    {
      variables: {
        skip: 0,
      },
    }
  );

  const [rowData, setRowData] = useState([
    {
      id: "",
      user: "",
      status: "",
      submitDate: "",
      vaultID: "",
      userProxyAddress: "",
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
        Header: "Vault Id",
        accessor: "vaultID",
      },
      {
        Header: "DSA",
        accessor: "userProxyAddress",
      },
    ],
    []
  );

  const decodeVaultUnsafe = (data) => {
    return String(
        decodeWithoutSignature(["uint256", "address", "bytes", "uint256"], data)[0]
    );
  };

  const decodeCanDoRefinance = (data) => {
    return String(
        decodeWithoutSignature(["address", "uint256", "address", "uint256", "string"], data)[0]
    );
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: rowData }, useSortBy);

  const createRowData = (data) => {
    const newRows = [];
    // Filter all tasks by known Tash Hashes
    for (let wrapper of data.taskReceiptWrappers) {
      if (!isDebtBridgeTask(wrapper.taskReceipt.tasks[0].actions[0]) ||
      !isKnownTask(wrapper.taskReceipt.tasks[wrapper.taskReceipt.index])
      )
        continue;

        console.log(wrapper);
        
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
        vaultID: 
          decodeVaultUnsafe(wrapper.taskReceipt.tasks[0].conditions[0].data)
        ,
        userProxyAddress : decodeCanDoRefinance(wrapper.taskReceipt.tasks[0].conditions[1].data)
      });
    }
    return newRows;
  };

  useEffect(() => {
    if (data) {
      const newRows = createRowData(data);
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
        <Button
          background="#4299e1"
          onClick={async () => {
            refetch();
            setRowData([
              {
                id: "",
                status: "",
                submitDate: "",
                vaultID: "",
                userProxyAddress: "",
              },
            ]);
            await sleep(1000);
            setRowData(createRowData(data));
          }}
        >
          Refresh
        </Button>
      </CardWrapper>
    </>
  );
};

export default AwaitingExecTaskOverview;
