import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { UserProvider } from "./contexts/UserContext";
import { system } from "./theme";
import { ColorModeProvider } from "./components/ui/color-mode";
import { Toaster } from "./components/ui/toaster";
import { registerServiceWorker, createOfflineIndicator } from './utils/registerServiceWorker';


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <UserProvider>
          <BrowserRouter>
            <App />
            <Toaster />
          </BrowserRouter>
        </UserProvider>
      </ColorModeProvider>
    </ChakraProvider>
  </React.StrictMode>,
);

registerServiceWorker();
createOfflineIndicator();
