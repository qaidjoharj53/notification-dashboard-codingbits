import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { addNotification } from '../store/notificationsSlice';
import { TextField, Button, Typography, Container, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from 'axios';

const AdminPortal: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'info' | 'alert' | 'message'>('info');
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/notifications/sendToAll', { title, message, category }, { withCredentials: true });
      setTitle('');
      setMessage('');
      setCategory('info');
      alert('Notification sent to all users successfully!');
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Send Notification to All Users
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="title"
            label="Notification Title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="message"
            label="Notification Message"
            id="message"
            multiline
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              id="category"
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as 'info' | 'alert' | 'message')}
            >
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="alert">Alert</MenuItem>
              <MenuItem value="message">Message</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Send Notification
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default AdminPortal;

