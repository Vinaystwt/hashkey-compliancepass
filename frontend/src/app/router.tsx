import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState, LoadingState } from "@/components/ui/StateBlocks";

const HomePage = lazy(() => import("@/app/routes/HomePage").then((module) => ({ default: module.HomePage })));
const VerifyPage = lazy(() => import("@/app/routes/VerifyPage").then((module) => ({ default: module.VerifyPage })));
const DemoPage = lazy(() => import("@/app/routes/DemoPage").then((module) => ({ default: module.DemoPage })));
const DashboardPage = lazy(() => import("@/app/routes/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const CredentialPage = lazy(() => import("@/app/routes/CredentialPage").then((module) => ({ default: module.CredentialPage })));
const DocsPage = lazy(() => import("@/app/routes/DocsPage").then((module) => ({ default: module.DocsPage })));

function RouteFallback() {
  return (
    <div className="page-frame-tight">
      <LoadingState title="Loading experience" description="Preparing the next interface surface." />
    </div>
  );
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

function RouteErrorBoundary() {
  const error = useRouteError();
  const description =
    isRouteErrorResponse(error)
      ? `${error.status} ${error.statusText}`
      : error instanceof Error
        ? error.message
        : "The requested route could not be rendered.";

  return (
    <div className="page-frame-tight">
      <ErrorState title="Page unavailable" description={description} />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: "verify", element: withSuspense(<VerifyPage />) },
      { path: "demo", element: withSuspense(<DemoPage />) },
      { path: "dashboard", element: withSuspense(<DashboardPage />) },
      { path: "credential", element: withSuspense(<CredentialPage />) },
      { path: "docs", element: withSuspense(<DocsPage />) },
    ],
  },
]);
