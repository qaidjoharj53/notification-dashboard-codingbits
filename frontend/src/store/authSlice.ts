import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosConfig";

interface AuthState {
	isAuthenticated: boolean;
	user: { id: string; username: string; role: string } | null;
	status: "idle" | "loading" | "succeeded" | "failed";
	error: string | null;
}

const initialState: AuthState = {
	isAuthenticated: false,
	user: null,
	status: "idle",
	error: null,
};

export const login = createAsyncThunk(
	"auth/login",
	async (credentials: { username: string; password: string }) => {
		const response = await axiosInstance.post("/auth/login", credentials);
		return response.data;
	}
);

export const checkAuth = createAsyncThunk("auth/checkAuth", async () => {
	const response = await axiosInstance.get("/auth/check");
	return response.data;
});

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(login.pending, (state) => {
				state.status = "loading";
				state.error = null;
			})
			.addCase(login.fulfilled, (state, action) => {
				state.isAuthenticated = true;
				state.user = action.payload;
				state.status = "succeeded";
				state.error = null;
			})
			.addCase(login.rejected, (state, action) => {
				state.status = "failed";
				state.error = action.error.message || "An error occurred";
			})
			.addCase(checkAuth.fulfilled, (state, action) => {
				state.isAuthenticated = true;
				state.user = action.payload;
				state.status = "succeeded";
			});
	},
});

export default authSlice.reducer;
