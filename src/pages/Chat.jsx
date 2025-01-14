import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Paper,
  List,
  ListItem,
} from '@mui/material';
import { styled } from '@mui/system';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

const PageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 48px)',
  width: '100%',
  backgroundColor: theme.palette.mode === 'dark' ? '#343541' : '#ffffff',
  marginTop: '48px',
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  scrollBehavior: 'smooth',
}));

const MessageWrapper = styled(Box)(({ theme, isuser }) => ({
  width: '100%',
  backgroundColor: 'transparent',
  padding: '0.5rem 1rem',
}));

const MessageContent = styled(Box)(({ theme, isuser }) => ({
  display: 'flex',
  maxWidth: '48rem',
  margin: '0 auto',
  padding: '0.75rem',
  gap: theme.spacing(3),
  alignItems: 'flex-start',
  justifyContent: isuser === 'true' ? 'flex-end' : 'flex-start',
}));

const MessageBubble = styled(Box)(({ theme, isuser }) => ({
  backgroundColor: isuser === 'true' 
    ? (theme.palette.mode === 'dark' ? '#343541' : '#f7f7f8') 
    : (theme.palette.mode === 'dark' ? '#343541' : '#ffffff'),
  borderRadius: '1rem',
  padding: '1rem 1.25rem',
  maxWidth: isuser === 'true' ? '60%' : '100%',
  width: isuser === 'true' ? 'auto' : '100%',
  boxShadow: '0 0 0.5rem rgba(0, 0, 0, 0.05)',
}));

const MessageAvatar = styled(Avatar)(({ theme, isuser }) => ({
  width: 30,
  height: 30,
  backgroundColor: isuser === 'true' 
    ? '#ef4444'
    : '#10a37f',
}));

const MessageText = styled(Typography)(({ theme }) => ({
  fontSize: '0.9375rem',
  lineHeight: '1.5',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  color: theme.palette.mode === 'dark' ? '#ececf1' : '#353740',
}));

const CodeBlock = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f6f6f6',
  padding: '1rem',
  borderRadius: '0.5rem',
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  whiteSpace: 'pre-wrap',
  overflowX: 'auto',
  marginTop: '0.5rem',
  color: theme.palette.mode === 'dark' ? '#e6e6e6' : '#1a1a1a',
}));

const InputContainer = styled(Box)(({ theme }) => ({
  position: 'sticky',
  bottom: 0,
  padding: '1.5rem',
  backgroundColor: theme.palette.mode === 'dark' ? '#343541' : '#ffffff',
}));

const InputWrapper = styled(Box)(({ theme }) => ({
  maxWidth: '48rem',
  margin: '0 auto',
  position: 'relative',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.mode === 'dark' ? '#40414f' : '#ffffff',
    borderRadius: '0.75rem',
    boxShadow: '0 0 15px rgba(0,0,0,0.1)',
    '& fieldset': {
      borderColor: theme.palette.mode === 'dark' ? '#565869' : '#e5e5e5',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.mode === 'dark' ? '#565869' : '#e5e5e5',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#10a37f',
      borderWidth: '1px',
    },
    '& .MuiOutlinedInput-input': {
      paddingRight: '3rem',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: `1px solid ${theme.palette.mode === 'dark' ? '#565869' : '#e5e5e5'}`,
  },
  '& .MuiOutlinedInput-input:focus': {
    outline: 'none !important',
    boxShadow: 'none',
  },
  '&& .MuiOutlinedInput-root': {
    '&.Mui-focused': {
      outline: 'none',
      boxShadow: 'none',
    }
  }
}));

const SendButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: '0.5rem',
  top: '50%',
  transform: 'translateY(-50%)',
  padding: '0.5rem',
  color: theme.palette.mode === 'dark' ? '#565869' : '#999999',
  transition: 'all 0.2s ease',
  '&:hover': {
    color: '#10a37f',
    backgroundColor: 'transparent',
  },
  '&.Mui-disabled': {
    color: theme.palette.mode === 'dark' ? '#565869' : '#999999',
  },
}));

const RotatingIcon = styled(SendIcon)(({ hastext }) => ({
  transform: hastext === 'true' ? 'rotate(0deg)' : 'rotate(-90deg)',
  transition: 'transform 0.2s ease',
}));

const formatMessage = (msg) => {
  if (msg.isQuery) {
    return (
      <>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary', 
            mb: 1, 
            fontWeight: 500,
            fontSize: '0.875rem' 
          }}
        >
          Generated SQL Query:
        </Typography>
        <CodeBlock>
          {msg.text}
        </CodeBlock>
      </>
    );
  }
  
  if (msg.isResult) {
    try {
      const formattedJson = JSON.stringify(JSON.parse(msg.text), null, 2);
      return (
        <CodeBlock>
          {formattedJson}
        </CodeBlock>
      );
    } catch {
      return msg.text;
    }
  }
  
  return msg.text;
};

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const processUserQuery = async (userMessage) => {
    if (message.trim()) {
      try {
        setIsLoading(true);
        
        setMessages(prev => [...prev, {
          user: 'You',
          text: userMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);

        const generateResponse = await axios.post('http://localhost:3001/api/generate-query', {
          prompt: userMessage
        });

        const sqlQuery = generateResponse.data.sqlQuery;
        
        setMessages(prev => [...prev, {
          user: 'System',
          text: sqlQuery,
          isQuery: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);

        const queryResponse = await axios.post('http://localhost:3001/api/execute-query', {
          query: sqlQuery
        });

        setMessages(prev => [...prev, {
          user: 'System',
          text: JSON.stringify(queryResponse.data),
          isResult: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);

      } catch (error) {
        const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message;
        setMessages(prev => [...prev, {
          user: 'System',
          text: `Error: ${errorMessage}`,
          isError: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
    <PageContainer>
      <ChatContainer>
        {messages.map((msg, index) => (
          <MessageWrapper key={index} isuser={msg.user === 'You' ? 'true' : 'false'}>
            <MessageContent isuser={msg.user === 'You' ? 'true' : 'false'}>
              {msg.user !== 'You' && (
                <MessageAvatar isuser={msg.user === 'You' ? 'true' : 'false'}>
                  <SmartToyIcon />
                </MessageAvatar>
              )}
              <MessageBubble isuser={msg.user === 'You' ? 'true' : 'false'}>
                <MessageText>
                  {formatMessage(msg)}
                </MessageText>
              </MessageBubble>
            </MessageContent>
          </MessageWrapper>
        ))}
      </ChatContainer>
      
      <InputContainer>
        <InputWrapper>
          <StyledTextField
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Send a message..."
            disabled={isLoading}
          />
          <SendButton
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <CircularProgress size={20} />
            ) : (
              <RotatingIcon hastext={message.trim() ? 'true' : 'false'} />
            )}
          </SendButton>
        </InputWrapper>
      </InputContainer>
    </PageContainer>
  );
};

export default Chat;
