import React from "react";
import { ReactComponent as Logo } from "./gelato_logo.svg";
// Logo Text
import { ReactComponent as GelatoLogoWord } from "./gelato_logo_word.svg";
const GelatoLogo = () => (
  <>
    <div
      style={{
        width: "35px",
        marginRight: "16px",
      }}
    >
      {/* Logo is an actual React component */}
      <Logo />
    </div>
    <div
      style={{
        width: "80px",
      }}
    >
      <GelatoLogoWord></GelatoLogoWord>
    </div>
  </>
);

export default GelatoLogo;
