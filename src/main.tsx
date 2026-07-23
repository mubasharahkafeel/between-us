import React from "react";
import ReactDOM from "react-dom/client";

document.body.style.margin = "0";

const root = document.getElementById("root");

if (root) {
  root.innerHTML = `
    <div style="
      min-height:100vh;
      background:#ff1744;
      color:white;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:40px;
      font-family:sans-serif;
      text-align:center;
    ">
      TEST SUCCESS ❤️
    </div>
  `;
} else {
  document.body.innerHTML = `
    <h1 style="color:red">
      ROOT NOT FOUND
    </h1>
  `;
}
