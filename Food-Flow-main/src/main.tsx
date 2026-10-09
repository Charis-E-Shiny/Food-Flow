import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import { DataModeProvider } from "./lib/dataMode";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DataModeProvider>
          <App />
        </DataModeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
