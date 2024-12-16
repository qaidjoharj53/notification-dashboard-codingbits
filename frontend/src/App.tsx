import React from "react";
import {
	BrowserRouter as Router,
	Route,
	Routes,
	Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "./store";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import AdminPortal from "./components/AdminPortal";

const App: React.FC = () => {
	const { isAuthenticated, user } = useSelector(
		(state: RootState) => state.auth
	);

	return (
		<Router>
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route
					path="/dashboard"
					element={
						isAuthenticated ? (
							<Dashboard />
						) : (
							<Navigate to="/login" />
						)
					}
				/>
				<Route
					path="/admin"
					element={
						isAuthenticated && user?.role === "admin" ? (
							<AdminPortal />
						) : (
							<Navigate to="/dashboard" />
						)
					}
				/>
				<Route path="*" element={<Navigate to="/dashboard" />} />
			</Routes>
		</Router>
	);
};

export default App;
