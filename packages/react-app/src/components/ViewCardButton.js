import React from "react";
import { ButtonBlue, ViewCard } from "../components";

const ViewCardButton = ({title, action}) => {
    return (
        <ViewCard>
            <ButtonBlue onClick={async () => {await action();}}>
                {title}
            </ButtonBlue>
        </ViewCard>
    )
}

export default ViewCardButton;