import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../store/authSlice";
import { AppDispatch, RootState } from "../store";
import { TextField, Button, Typography, Container, Box } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";

const Register: React.FC = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const { status, error } = useSelector((state: RootState) => state.auth);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await dispatch(register({ username, password })).unwrap();
			navigate("/dashboard");
		} catch (err) {
			console.error("Failed to register:", err);
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
					Register
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
						autoComplete="new-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<Button
						type="submit"
						fullWidth
						variant="contained"
						sx={{ mt: 3, mb: 2 }}
						disabled={status === "loading"}>
						{status === "loading" ? "Registering..." : "Register"}
					</Button>
					{error && (
						<Typography color="error" align="center">
							{error}
						</Typography>
					)}
					<Link to="/login">
						{"Already have an account? Sign In"}
					</Link>
				</Box>
			</Box>
		</Container>
	);
};

export default Register;
