import React from "react";
import { Button, ViewCard } from "../components";

const ViewCardButton = ({ title, action }) => {
  return (
    <ViewCard>
      <Button
        onClick={async () => {
          await action();
        }}
      >
        {title}
      </Button>
    </ViewCard>
  );
};

export default ViewCardButton;
