import "./index.css";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router";
import routes from "~react-pages";

import AppShell from "./components/shell/AppShell";
import { LocaleProvider } from "./components/storefront/LocaleProvider";

// eslint-disable-next-line react-refresh/only-export-components
function App() {
  const element = useRoutes(routes);
  return (
    <LocaleProvider>
      <AppShell>
        <Suspense fallback={<p>...</p>}>{element}</Suspense>
      </AppShell>
    </LocaleProvider>
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
