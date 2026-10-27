import "./index.css";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router";
import routes from "~react-pages";

import AppShell from "./components/shell/AppShell";
import LoadingFrame from "./components/shell/LoadingFrame";

// eslint-disable-next-line react-refresh/only-export-components
function App() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingFrame />}>{useRoutes(routes)}</Suspense>
    </AppShell>
  );
}

const app = createRoot(document.getElementById("root")!);

app.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
