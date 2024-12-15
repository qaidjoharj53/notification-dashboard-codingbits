import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme();
const container = document.getElementById("root");

if (container) {
	const root = ReactDOM.createRoot(container);
	root.render(
		<React.StrictMode>
			<Provider store={store}>
				<ThemeProvider theme={theme}>
					<CssBaseline />
					<App />
				</ThemeProvider>
			</Provider>
		</React.StrictMode>
	);
}
