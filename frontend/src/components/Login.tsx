import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/authSlice";
import { AppDispatch, RootState } from "../store";
import { TextField, Button, Typography, Container, Box } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";

const Login: React.FC = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const { status, error } = useSelector((state: RootState) => state.auth);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const result = await dispatch(
				login({ username, password })
			).unwrap();
			console.log("Login successful:", result);
			navigate("/dashboard");
		} catch (err) {
			console.error("Failed to log in:", err);
		}
	};

	return (
		<Container component="main" maxWidth="xs">
			<Box
				sx={{
					marginTop: 8,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}>
				<Typography component="h1" variant="h5">
					Log in
				</Typography>
				<Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
					<TextField
						margin="normal"
						required
						fullWidth
						id="username"
						label="Username"
						name="username"
						autoComplete="username"
						autoFocus
						value={username}
						onChange={(e) => setUsername(e.target.value)}
					/>
					<TextField
						margin="normal"
						required
						fullWidth
						name="password"
						label="Password"
						type="password"
						id="password"
						autoComplete="current-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<Button
						type="submit"
						fullWidth
						variant="contained"
						sx={{ mt: 3, mb: 2 }}
						disabled={status === "loading"}>
						{status === "loading" ? "Logging in..." : "Log In"}
					</Button>
					{error && (
						<Typography color="error" align="center">
							{error}
						</Typography>
					)}
					<Link to="/register">
						{"Don't have an account? Sign Up"}
					</Link>
				</Box>
			</Box>
		</Container>
	);
};

export default Login;
