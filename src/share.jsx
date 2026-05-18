import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ShareApp from "./components/SharedRecipeView.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ShareApp />
  </StrictMode>
);
