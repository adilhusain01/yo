import { Buffer } from "buffer";
globalThis.Buffer = Buffer;
window.Buffer = Buffer;

import React from "react";
import ReactDOM from "react-dom/client";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import App from "./App";
import "./index.scss";
import "./patch-local-storage-for-github-pages";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
    <App />
  </TonConnectUIProvider>
);
