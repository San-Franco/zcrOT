import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import RootLayout from "@/pages/main/layouts/root-layout";
import ErrorElement from "@/pages/not-found/error-element";
import Loader from "@/components/shared/loader";
import { loginAction } from "@/router/actions";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import {
  authGuardLoader,
  communicationControlLoader,
  powerMonitoringLoader,
  portsManagementLoader,
  rootLayoutLoader,
  securityExposureLoader,
  userManagementLoader,
  detectionEngineLoader,
} from "./router/loaders";

const LoginPage = lazy(() => import("@/pages/auth/login-page"));
const CommunicationControlPage = lazy(() => import("@/pages/main/communication-control-page"));
const PowerMonitoringPage = lazy(() => import("@/pages/main/power-monitoring-page"));
const PortsManagementPage = lazy(() => import("@/pages/main/ports-management-page"));
const SecurityExposurePage = lazy(() => import("@/pages/main/security-exposure-page"));
const DetectionEnginePage = lazy(() => import("@/pages/main/detection-engine-page"));
const UserManagementPage = lazy(() => import("@/pages/main/user-management-page"));
const ReportPage = lazy(() => import("@/report"));
const NotFound = lazy(() => import("@/pages/not-found/not-found"));

function lazyElement(Component: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={<Loader />}>
      <Component />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    loader: rootLayoutLoader,
    errorElement: <ErrorElement />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard/communication-control" replace />,
      },
      {
        path: "dashboard",
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard/communication-control" replace />,
          },
          {
            path: "communication-control",
            element: lazyElement(CommunicationControlPage),
            loader: communicationControlLoader,
          },
          {
            path: "security-exposure",
            element: lazyElement(SecurityExposurePage),
            loader: securityExposureLoader,
          },
          {
            path: "detection-engine",
            element: lazyElement(DetectionEnginePage),
            loader: detectionEngineLoader
          },
          {
            path: "power-monitoring",
            element: lazyElement(PowerMonitoringPage),
            loader: powerMonitoringLoader,
          },
          {
            path: "ports-management",
            element: lazyElement(PortsManagementPage),
            loader: portsManagementLoader,
          },
          {
            path: "user-management",
            element: lazyElement(UserManagementPage),
            loader: userManagementLoader,
          },
          {
            path: "report",
            element: lazyElement(ReportPage),
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    element: lazyElement(LoginPage),
    loader: authGuardLoader,
    action: loginAction,
    errorElement: <ErrorElement />,
  },
  {
    path: "*",
    element: lazyElement(NotFound),
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
