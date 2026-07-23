import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.innerHTML =
    '<h1 style="color:red">ERROR: root element not found</h1>';
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <App />
    );
  } catch (error) {
    document.body.innerHTML = `
      <div style="padding:20px;color:red;background:white;font-family:monospace">
        <h2>STARTUP ERROR</h2>
        <pre>${String(error)}</pre>
      </div>
    `;
  }
}
