import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      user: 'Max Verstappen',
      text: 'That was some intense racing today!',
      time: '15:10',
    },
    {
      user: 'Lewis Hamilton',
      text: 'Great battle out there, looking forward to the next race.',
      time: '15:12',
    },
    {
      user: 'Charles Leclerc',
      text: 'Ferrari is looking strong for the upcoming weekend.',
      time: '15:15',
    },
  ]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          user: 'You',
          text: message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '90vh', py: 4 }}>
      <Container maxWidth="md">
        <Paper
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 0,
            height: '70vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
              F1 Community Chat
            </Typography>
          </Box>

          <List sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            {messages.map((msg, index) => (
              <ListItem
                key={index}
                sx={{
                  flexDirection: msg.user === 'You' ? 'row-reverse' : 'row',
                  gap: 1,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: msg.user === 'You' ? 'primary.main' : 'grey.800',
                    width: 32,
                    height: 32,
                  }}
                >
                  {msg.user[0]}
                </Avatar>
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: msg.user === 'You' ? 'primary.main' : 'grey.800',
                    maxWidth: '70%',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                    {msg.user}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>
                    {msg.text}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', display: 'block', textAlign: 'right' }}
                  >
                    {msg.time}
                  </Typography>
                </Paper>
              </ListItem>
            ))}
          </List>

          <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.default',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                }}
              />
              <IconButton
                onClick={handleSend}
                disabled={!message.trim()}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Chat;
