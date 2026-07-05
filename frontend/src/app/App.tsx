import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./AuthProvider";
import { Layout } from "./Layout";
import { LoadingState } from "../components/ui";

const AiPage = lazy(() => import("../pages/AiPage").then((module) => ({ default: module.AiPage })));
const DashboardPage = lazy(() => import("../pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const AuthCallbackPage = lazy(() => import("../pages/AuthCallbackPage").then((module) => ({ default: module.AuthCallbackPage })));
const ExecutivePage = lazy(() => import("../pages/ExecutivePage").then((module) => ({ default: module.ExecutivePage })));
const LandingPage = lazy(() => import("../pages/LandingPage").then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import("../pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage").then((module) => ({ default: module.NotificationsPage })));
const ProfilePage = lazy(() => import("../pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const ReportsPage = lazy(() => import("../pages/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const RepositoriesPage = lazy(() => import("../pages/RepositoriesPage").then((module) => ({ default: module.RepositoriesPage })));
const RepositoryPage = lazy(() => import("../pages/RepositoryPage").then((module) => ({ default: module.RepositoryPage })));
const SearchPage = lazy(() => import("../pages/SearchPage").then((module) => ({ default: module.SearchPage })));
const SecurityPage = lazy(() => import("../pages/SecurityPage").then((module) => ({ default: module.SecurityPage })));
const SettingsPage = lazy(() => import("../pages/SettingsPage").then((module) => ({ default: module.SettingsPage })));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingState label="Loading page" />}>
        <Routes>
          <Route index element={<LandingPage />} />
          <Route path="welcome" element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="auth/github/callback" element={<AuthCallbackPage />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="repositories" element={<RepositoriesPage />} />
            <Route path="repositories/:id" element={<RepositoryPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="executive" element={<ExecutivePage />} />
            <Route path="ai" element={<AiPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="search" element={<SearchPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
