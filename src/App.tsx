import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import DeadCityHub from "./pages/dead-city/DeadCityHub";
import DeadCityPrivacyPolicy from "./pages/dead-city/DeadCityPrivacyPolicy";
import DeadCityTerms from "./pages/dead-city/DeadCityTerms";
import NotFound from "./pages/NotFound";

const TrailerHubApp = lazy(() => import("./TrailerHubApp"));

const DeadCityApp = () => (
  <HelmetProvider>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/dead-city" element={<DeadCityHub />} />
        <Route path="/dead-city/privacy-policy" element={<DeadCityPrivacyPolicy />} />
        <Route path="/dead-city/terms-and-conditions" element={<DeadCityTerms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </HelmetProvider>
);

const App = () => {
  const isDeadCity = window.location.pathname === "/dead-city"
    || window.location.pathname.startsWith("/dead-city/");

  if (isDeadCity) return <DeadCityApp />;

  return (
    <Suspense fallback={null}>
      <TrailerHubApp />
    </Suspense>
  );
};

export default App;
