import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface AuthState {
	isAuthenticated: boolean;
	user: string | null;
	status: "idle" | "loading" | "succeeded" | "failed";
	error: string | null;
}

const initialState: AuthState = {
	isAuthenticated: false,
	user: null,
	status: "idle",
	error: null,
};

export const register = createAsyncThunk(
	"auth/register",
	async (credentials: { username: string; password: string }) => {
		const response = await axios.post("/api/auth/register", credentials);
		return response.data;
	}
);

export const login = createAsyncThunk(
	"auth/login",
	async (credentials: { username: string; password: string }) => {
		const response = await axios.post("/api/auth/login", credentials);
		return response.data;
	}
);

export const logout = createAsyncThunk("auth/logout", async () => {
	const response = await axios.post("/api/auth/logout");
	return response.data;
});

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(register.fulfilled, (state, action) => {
				state.isAuthenticated = true;
				state.user = action.payload.username;
				state.status = "succeeded";
			})
			.addCase(login.fulfilled, (state, action) => {
				state.isAuthenticated = true;
				state.user = action.payload.username;
				state.status = "succeeded";
			})
			.addCase(logout.fulfilled, (state) => {
				state.isAuthenticated = false;
				state.user = null;
				state.status = "idle";
			})
			.addMatcher(
				(action) => action.type.endsWith("/pending"),
				(state) => {
					state.status = "loading";
					state.error = null;
				}
			)
			.addMatcher(
				(action) => action.type.endsWith("/rejected"),
				(state, action) => {
					state.status = "failed";
					state.error =
						(action as any).error.message || "An error occurred";
				}
			);
	},
});

export default authSlice.reducer;
