import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	fetchNotifications,
	markNotification,
	deleteNotification,
} from "../store/notificationsSlice";
import { logout } from "../store/authSlice";
import { AppDispatch, RootState } from "../store";
import {
	Container,
	Typography,
	Button,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	IconButton,
	Badge,
	Chip,
} from "@mui/material";
import { Delete, CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const Dashboard: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const { items: notifications, status } = useSelector(
		(state: RootState) => state.notifications
	);
	const [filter, setFilter] = useState<"all" | "info" | "alert" | "message">(
		"all"
	);

	useEffect(() => {
		dispatch(fetchNotifications());

		const socket = io("http://localhost:5000");
		socket.on("newNotification", (notification) => {
			dispatch({
				type: "notifications/addNewNotification",
				payload: notification,
			});
		});
		socket.on("updateNotification", (notification) => {
			dispatch({
				type: "notifications/updateExistingNotification",
				payload: notification,
			});
		});
		socket.on("deleteNotification", (id) => {
			dispatch({ type: "notifications/removeNotification", payload: id });
		});

		return () => {
			socket.disconnect();
		};
	}, [dispatch]);

	const handleLogout = async () => {
		await dispatch(logout());
		navigate("/login");
	};

	const handleMarkRead = (id: string, currentStatus: boolean) => {
		dispatch(markNotification({ id, read: !currentStatus }));
	};

	const handleDelete = (id: string) => {
		dispatch(deleteNotification(id));
	};

	const filteredNotifications = notifications.filter(
		(notification) => filter === "all" || notification.category === filter
	);

	const unreadCount = notifications.filter((n) => !n.read).length;

	return (
		<Container>
			<Typography variant="h4" component="h1" gutterBottom>
				Notification Dashboard
			</Typography>
			<Button
				onClick={handleLogout}
				variant="contained"
				color="secondary">
				Logout
			</Button>
			<Badge badgeContent={unreadCount} color="primary">
				<Typography variant="h6">Notifications</Typography>
			</Badge>
			<div>
				<Chip
					label="All"
					onClick={() => setFilter("all")}
					color={filter === "all" ? "primary" : "default"}
				/>
				<Chip
					label="Info"
					onClick={() => setFilter("info")}
					color={filter === "info" ? "primary" : "default"}
				/>
				<Chip
					label="Alert"
					onClick={() => setFilter("alert")}
					color={filter === "alert" ? "primary" : "default"}
				/>
				<Chip
					label="Message"
					onClick={() => setFilter("message")}
					color={filter === "message" ? "primary" : "default"}
				/>
			</div>
			{status === "loading" && <Typography>Loading...</Typography>}
			{status === "failed" && (
				<Typography color="error">
					Error loading notifications
				</Typography>
			)}
			<List>
				{filteredNotifications.map((notification) => (
					<ListItem key={notification._id} component="button">
						<ListItemText
							primary={notification.title}
							secondary={
								<>
									<Typography
										component="span"
										variant="body2"
										color="textPrimary">
										{notification.message}
									</Typography>
									<br />
									{new Date(
										notification.timestamp
									).toLocaleString()}
								</>
							}
						/>
						<Chip
							label={notification.category}
							color="primary"
							size="small"
						/>
						<ListItemSecondaryAction>
							<IconButton
								edge="end"
								aria-label="mark read"
								onClick={() =>
									handleMarkRead(
										notification._id,
										notification.read
									)
								}>
								{notification.read ? (
									<CheckCircle />
								) : (
									<RadioButtonUnchecked />
								)}
							</IconButton>
							<IconButton
								edge="end"
								aria-label="delete"
								onClick={() => handleDelete(notification._id)}>
								<Delete />
							</IconButton>
						</ListItemSecondaryAction>
					</ListItem>
				))}
			</List>
		</Container>
	);
};

export default Dashboard;
