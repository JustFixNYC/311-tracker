import {
  Route,
  Outlet,
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  ScrollRestoration,
} from "react-router-dom";
import { SWRConfig } from "swr";
import { useRollbar } from "@rollbar/react";

import { I18n } from "./i18n";
import { NetworkError } from "./api/error-reporting";
import { PrivacyPolicy } from "./Components/Pages/Legal/PrivacyPolicy";
import { TermsOfUse } from "./Components/Pages/Legal/TermsOfUse";
import { Home } from "./Components/Pages/Home/Home";

const Layout = () => {
  return (
    <I18n>
      <div id="container">
        <main id="main">
          <div id="content">
            <Outlet />
          </div>
        </main>

        <ScrollRestoration />
      </div>
    </I18n>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Routes with locale prefix */}
      <Route path="/:locale" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="privacy_policy" element={<PrivacyPolicy />} />
        <Route path="terms_of_use" element={<TermsOfUse />} />
      </Route>
      {/* Catch-all route for paths without locale - will redirect */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="*" element={<Home />} />
      </Route>
    </>
  )
);

function App() {
  const rollbar = useRollbar();

  return (
    <SWRConfig
      value={{
        onError: (error) => {
          if (error instanceof NetworkError && !error.shouldReport) return;
          rollbar.error(error);
        },
      }}
    >
      <RouterProvider router={router} />
    </SWRConfig>
  );
}

export default App;
