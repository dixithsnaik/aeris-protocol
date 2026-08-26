import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./app/router";
import { ui } from "./config/ui";
import "./index.css";

document.title = ui.documentTitle;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
