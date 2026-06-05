import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import LoginPage
from "./pages/LoginPage";

import DashboardPage
from "./pages/DashboardPage";

import CreateTicketPage
from "./pages/CreateTicketPage";

import DispatcherPage
from "./pages/DispatcherPage";

import ProtectedRoute
from "./components/ProtectedRoute";

import TicketDetailsPage
from "./pages/TicketDetailsPage";

import RegisterPage
from "./pages/RegisterPage";

import ProfilePage
from "./pages/ProfilePage";

import UsersPage
from "./pages/UsersPage";

import NotificationsPage
from "./pages/NotificationsPage";

import ExecutorTicketsPage
from "./pages/ExecutorTicketsPage";

import ActionLogPage
from "./pages/ActionLogPage";

import {
    getHomePath,
    getRole,
    isAuthenticated
} from "./auth/auth";


function RoleRoute({
    children,
    roles
}) {

    const role = getRole();

    if (!role) {
        return <Navigate to="/" replace />;
    }

    if (!roles.includes(role)) {
        return <Navigate to={getHomePath(role)} replace />;
    }

    return children;
}


function HomeRedirect() {

    if (!isAuthenticated()) {
        return <LoginPage />;
    }

    return (
        <Navigate
            to={getHomePath(getRole())}
            replace
        />
    );
}


function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<HomeRedirect />}
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <RoleRoute roles={["resident"]}>
                                <DashboardPage />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/create-ticket"
                    element={
                        <ProtectedRoute>
                            <RoleRoute roles={["resident"]}>
                                <CreateTicketPage />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dispatcher"
                    element={
                        <ProtectedRoute>
                            <RoleRoute roles={["dispatcher"]}>
                                <DispatcherPage />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/action-log"
                    element={
                        <ProtectedRoute>
                            <RoleRoute roles={["dispatcher"]}>
                                <ActionLogPage />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/executor-tickets"
                    element={
                        <ProtectedRoute>
                            <RoleRoute roles={["executor"]}>
                                <ExecutorTicketsPage />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/users"
                    element={
                        <ProtectedRoute>
                            <RoleRoute roles={["admin"]}>
                                <UsersPage />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/tickets/:id"
                    element={
                        <ProtectedRoute>
                            <RoleRoute roles={["resident", "dispatcher", "executor"]}>
                                <TicketDetailsPage />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/register"
                    element={<RegisterPage />}
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <RoleRoute roles={["resident", "executor", "dispatcher", "admin"]}>
                                <ProfilePage />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute>
                            <RoleRoute roles={["resident", "executor", "dispatcher", "admin"]}>
                                <NotificationsPage />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;
