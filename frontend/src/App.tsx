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

const App: React.FC = () => {
	const isAuthenticated = useSelector(
		(state: RootState) => state.auth.isAuthenticated
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
				<Route path="*" element={<Navigate to="/dashboard" />} />
			</Routes>
		</Router>
	);
};

export default App;
