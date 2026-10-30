import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { BackgroundMusic } from "./ui/components/common/BackgroundMusic";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <BackgroundMusic />
  </React.StrictMode>
);
