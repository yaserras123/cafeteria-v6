import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
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
import { useAuth } from "./_core/hooks/useAuth";
import { toast } from "sonner";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/menu/:tableToken"} component={CustomerMenu} />
      
      {/* ===== OWNER DASHBOARD ROUTES ===== */}
      <Route path={"/dashboard/owner"} component={() => <ProtectedRoute component={OwnerDashboard} allowedRoles={["owner"]} />} />
      <Route path={"/dashboard/owner/cafeterias"} component={() => <ProtectedRoute component={OwnerCafeterias} allowedRoles={["owner"]} />} />
      <Route path={"/dashboard/owner/marketers"} component={() => <ProtectedRoute component={OwnerMarketers} allowedRoles={["owner"]} />} />
      <Route path={"/dashboard/owner/points"} component={() => <ProtectedRoute component={OwnerPoints} allowedRoles={["owner"]} />} />
      <Route path={"/dashboard/owner/reports"} component={() => <ProtectedRoute component={OwnerReports} allowedRoles={["owner"]} />} />
      <Route path={"/dashboard/owner/settings"} component={() => <ProtectedRoute component={OwnerSettings} allowedRoles={["owner"]} />} />

      {/* ===== MARKETER DASHBOARD ROUTES ===== */}
      <Route path={"/dashboard/marketer"} component={() => <ProtectedRoute component={MarketerDashboard} allowedRoles={["marketer"]} />} />
      <Route path={"/dashboard/marketer/downlines"} component={() => <ProtectedRoute component={MarketerDownlines} allowedRoles={["marketer"]} />} />
      <Route path={"/dashboard/marketer/commissions"} component={() => <ProtectedRoute component={MarketerCommissions} allowedRoles={["marketer"]} />} />
      <Route path={"/dashboard/marketer/reports"} component={() => <ProtectedRoute component={MarketerReports} allowedRoles={["marketer"]} />} />

      {/* ===== CAFETERIA ADMIN DASHBOARD ROUTES ===== */}
      <Route path={"/dashboard/cafeteria-admin"} component={() => <ProtectedRoute component={CafeteriaDashboard} allowedRoles={["cafeteria_admin", "admin"]} />} />
      <Route path={"/dashboard/cafeteria-admin/menu"} component={() => <ProtectedRoute component={CafeteriaMenu} allowedRoles={["cafeteria_admin", "admin"]} />} />
      <Route path={"/dashboard/cafeteria-admin/tables"} component={() => <ProtectedRoute component={CafeteriaTables} allowedRoles={["cafeteria_admin", "admin"]} />} />
      <Route path={"/dashboard/cafeteria-admin/staff"} component={() => <ProtectedRoute component={CafeteriaStaff} allowedRoles={["cafeteria_admin", "admin"]} />} />
      <Route path={"/dashboard/cafeteria-admin/orders"} component={() => <ProtectedRoute component={CafeteriaOrders} allowedRoles={["cafeteria_admin", "admin"]} />} />
      <Route path={"/dashboard/cafeteria-admin/reports"} component={() => <ProtectedRoute component={CafeteriaReports} allowedRoles={["cafeteria_admin", "admin"]} />} />
      <Route path={"/dashboard/cafeteria-admin/recharge"} component={() => <ProtectedRoute component={CafeteriaRecharge} allowedRoles={["cafeteria_admin", "admin"]} />} />
      <Route path={"/dashboard/cafeteria-admin/settings"} component={() => <ProtectedRoute component={CafeteriaSettings} allowedRoles={["cafeteria_admin", "admin"]} />} />

      {/* ===== MANAGER DASHBOARD ROUTES ===== */}
      <Route path={"/dashboard/manager"} component={() => <ProtectedRoute component={ManagerDashboard} allowedRoles={["manager"]} />} />
      <Route path={"/dashboard/manager/orders"} component={() => <ProtectedRoute component={ManagerOrders} allowedRoles={["manager"]} />} />
      <Route path={"/dashboard/manager/staff"} component={() => <ProtectedRoute component={ManagerStaff} allowedRoles={["manager"]} />} />
      <Route path={"/dashboard/manager/reports"} component={() => <ProtectedRoute component={ManagerReports} allowedRoles={["manager"]} />} />

      {/* ===== WAITER DASHBOARD ROUTES ===== */}
      <Route path={"/dashboard/waiter"} component={() => <ProtectedRoute component={WaiterDashboard} allowedRoles={["waiter"]} />} />
      <Route path={"/dashboard/waiter/tables"} component={() => <ProtectedRoute component={WaiterTables} allowedRoles={["waiter"]} />} />
      <Route path={"/dashboard/waiter/orders"} component={() => <ProtectedRoute component={WaiterOrders} allowedRoles={["waiter"]} />} />

      {/* ===== CHEF DASHBOARD ROUTES ===== */}
      <Route path={"/dashboard/chef"} component={() => <ProtectedRoute component={ChefDashboard} allowedRoles={["chef"]} />} />
      <Route path={"/dashboard/chef/kitchen-board"} component={() => <ProtectedRoute component={ChefKitchenBoard} allowedRoles={["chef"]} />} />

      {/* ===== OTHER ROUTES ===== */}
      <Route path={"/reports"} component={ReportingDashboard} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [autoLogoutTime, setAutoLogoutTime] = useState(120 * 60 * 1000); // Default 2 hours

  // This useEffect now relies on the useAuth hook for authentication state
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const checkSession = async () => {
      if (!isAuthenticated && localStorage.getItem('last_activity')) {
        // If not authenticated by useAuth but localStorage still has activity, force logout
        localStorage.removeItem('last_activity');
        toast.error("Session expired. Please login again.");
        setLocation('/login');
        return;
      }

      if (isAuthenticated) {
        const lastActivity = localStorage.getItem('last_activity');
        if (lastActivity) {
          const now = Date.now();
          if (now - parseInt(lastActivity) > autoLogoutTime) {
            logout(); // Use the logout from useAuth
            toast.error("Session expired due to inactivity. Please login again.");
            setLocation('/login');
          }
        }
      }
    };

    const updateActivity = () => {
      if (isAuthenticated) {
        localStorage.setItem('last_activity', Date.now().toString());
      }
    };

    if (isAuthenticated) {
      interval = setInterval(checkSession, 30000); // Check every 30 seconds
      window.addEventListener('mousemove', updateActivity);
      window.addEventListener('keydown', updateActivity);
      window.addEventListener('click', updateActivity);
      window.addEventListener('scroll', updateActivity);
    } else {
      // Clear any existing interval or listeners if not authenticated
      if (interval) clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    }

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [isAuthenticated, autoLogoutTime, setLocation, logout]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
