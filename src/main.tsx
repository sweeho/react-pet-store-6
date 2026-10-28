import "./index.css";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router";
import AppShell from "./components/shell/AppShell";
import routes from "~react-pages";

// eslint-disable-next-line react-refresh/only-export-components
function App() {
  return (
    <Suspense fallback={<p>...</p>}>
      <AppShell>{useRoutes(routes)}</AppShell>
    </Suspense>
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
