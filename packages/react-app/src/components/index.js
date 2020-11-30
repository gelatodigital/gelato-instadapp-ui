import styled from "styled-components";

export const Header = styled.header`
  background-color: #c8dcec;
  min-height: 70px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  color: white;
  .gelato-logo {
    margin-left: 20px;
    margin-right: auto;
    text-decoration: "none";
    color: white;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }
`;

export const Body = styled.body`
  align-items: center;
  background-color: #fcfdff;
  color: white;
  display: flex;
  flex-direction: column;
  font-size: calc(10px + 2vmin);
  justify-content: flex-start;
  min-height: calc(100vh - 70px);
  padding-top: 5vh;
`;

export const ViewCard = styled.div`
  align-items: center;
  text-align: center;
  background-color: #c8dcec;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 25px;
  box-shadow: 2px 2px 4px #000000;
  font-weight: bold;
  height: 75%;
  width: 20%;
  color: #483D8B;
  p {
    margin: 0px 0px 8px;
  }
`;

export const CardWrapper = styled.div`
  align-items: center;
  background-color: white;
  display: flex;
  flex-direction: row;
  font-size: 1.5vmin;
  justify-content: space-around;
  height: 30vh;
  min-width: 70%;
  margin-bottom: 24px;
`;

export const Image = styled.img`
  height: 40vmin;
  margin-bottom: 16px;
  pointer-events: none;
`;

export const HyperLink = styled.a.attrs({
  target: "_blank",
  rel: "noopener noreferrer",
})`
  color: #483D8B;
  margin: 0px 20px;
  padding: 12px 24px;
`;

export const Button = styled.button`
  background-color: ${(props) => props.background};
  border: none;
  border-radius: 8px;
  color: #282c34;
  cursor: pointer;
  font-size: 16px;
  text-align: center;
  text-decoration: none;
  margin: 0px 20px;
  padding: 12px 24px;

  ${(props) => props.hidden && "hidden"} :focus {
    border: none;
    outline: none;
  }
`;
