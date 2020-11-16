import React from "react";
import { ViewCard } from "../components";

const ViewCardWrapper = ({ title, state }) => {
  return (
    <ViewCard>
      <p>{title}</p>
      <p>{state}</p>
    </ViewCard>
  );
};

export default ViewCardWrapper;
