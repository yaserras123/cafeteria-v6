import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ManagerDashboard from "./pages/ManagerDashboard";
import WaiterDashboard from "./pages/WaiterDashboard";
import ChefDashboard from "./pages/ChefDashboard";
import ReportingDashboard from "./pages/ReportingDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import MarketerDashboard from "./pages/MarketerDashboard";
import CafeteriaDashboard from "./pages/CafeteriaDashboard";
import CustomerMenu from "./pages/CustomerMenu";
import Upgrade from "./pages/Upgrade";
import UpgradeSuccess from "./pages/UpgradeSuccess";
import UpgradeCancel from "./pages/UpgradeCancel";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/menu/:tableToken"} component={CustomerMenu} />
      <Route
        path={"/dashboard/owner"}
        component={() => (
          <ProtectedRoute component={OwnerDashboard} allowedRoles={["owner"]} />
        )}
      />
      <Route
        path={"/dashboard/marketer"}
        component={() => (
          <ProtectedRoute
            component={MarketerDashboard}
            allowedRoles={["marketer"]}
          />
        )}
      />
      <Route
        path={"/dashboard/cafeteria"}
        component={() => (
          <ProtectedRoute
            component={CafeteriaDashboard}
            allowedRoles={["admin"]}
          />
        )}
      />
      <Route
        path={"/dashboard/manager"}
        component={() => (
          <ProtectedRoute
            component={ManagerDashboard}
            allowedRoles={["manager"]}
          />
        )}
      />
      <Route
        path={"/dashboard/waiter"}
        component={() => (
          <ProtectedRoute
            component={WaiterDashboard}
            allowedRoles={["waiter"]}
          />
        )}
      />
      <Route
        path={"/dashboard/chef"}
        component={() => (
          <ProtectedRoute component={ChefDashboard} allowedRoles={["chef"]} />
        )}
      />
      <Route path={"/reports"} component={ReportingDashboard} />
      <Route path={"/upgrade"} component={Upgrade} />
      <Route path={"/upgrade/success"} component={UpgradeSuccess} />
      <Route path={"/upgrade/cancel"} component={UpgradeCancel} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
