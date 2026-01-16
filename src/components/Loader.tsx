import React from "react";
import Header from "./Header.tsx";
import { Spinner } from "@chakra-ui/react";

export const Loader: React.FC = () => {
  return (
    <>
      <Header />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spinner size="xl" />
      </div>
    </>
  );
};
