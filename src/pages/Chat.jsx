import { useState } from 'react';
import axios from 'axios';
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
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const processUserQuery = async (userMessage) => {
    if (message.trim()) {
      try {
        setIsLoading(true);
        
        // Add user message to chat
        setMessages(prev => [...prev, {
          user: 'You',
          text: userMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);

        // Generate SQL query
        console.log('Generating SQL query...');
        const generateResponse = await axios.post('http://localhost:3001/api/generate-query', {
          prompt: userMessage
        }).catch(error => {
          console.error('Error generating query:', error.response?.data || error);
          throw new Error(error.response?.data?.details || error.response?.data?.error || error.message);
        });

        const sqlQuery = generateResponse.data.sqlQuery;
        console.log('Generated SQL query:', sqlQuery);

        // Add SQL query to chat
        setMessages(prev => [...prev, {
          user: 'System',
          text: `Generated SQL Query:\n${sqlQuery}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isQuery: true
        }]);

        // Execute SQL query
        console.log('Executing SQL query...');
        const queryResponse = await axios.post('http://localhost:3001/api/execute-query', {
          query: sqlQuery
        }).catch(error => {
          console.error('Error executing query:', error.response?.data || error);
          throw new Error(
            error.response?.data?.details || 
            error.response?.data?.error || 
            error.message
          );
        });

        console.log('Query results:', queryResponse.data);

        // Add query results to chat
        setMessages(prev => [...prev, {
          user: 'System',
          text: JSON.stringify(queryResponse.data, null, 2),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isResult: true
        }]);

      } catch (error) {
        console.error('Error in processUserQuery:', error);
        const errorDetails = error.response?.data?.details || error.response?.data?.error || error.message;
        const errorPath = error.response?.data?.path;
        const errorMessage = errorPath 
          ? `Error: ${errorDetails}\nDatabase path: ${errorPath}`
          : `Error: ${errorDetails}`;
        
        setMessages(prev => [...prev, {
          user: 'System',
          text: errorMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }]);
      } finally {
        setIsLoading(false);
        setMessage('');
      }
    }
  };

  const handleSend = () => {
    processUserQuery(message);
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
            borderRadius: 2,
            height: '70vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
              F1 Data Assistant
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
                    bgcolor: msg.user === 'You' ? 'primary.main' : 
                           msg.isError ? 'error.main' : 'grey.800',
                    width: 32,
                    height: 32,
                  }}
                >
                  {msg.user[0]}
                </Avatar>
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: msg.user === 'You' ? 'primary.main' : 
                            msg.isError ? 'error.main' :
                            msg.isQuery ? 'info.dark' :
                            'grey.800',
                    maxWidth: '70%',
                    whiteSpace: 'pre-wrap',
                    fontFamily: msg.isQuery || msg.isResult ? 'monospace' : 'inherit',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                    {msg.user}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', mt: 1 }}>
                    {msg.text}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                    {msg.time}
                  </Typography>
                </Paper>
              </ListItem>
            ))}
          </List>

          <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask about F1 statistics..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <IconButton 
              onClick={handleSend} 
              color="primary" 
              disabled={isLoading}
              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Chat;
