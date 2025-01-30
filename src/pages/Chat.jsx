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
            Query Result:
          </Typography>
          <CodeBlock>
            {formattedJson}
          </CodeBlock>
        </>
      );
    } catch {
      return msg.text;
    }
  }

  if (msg.isResponse) {
    return (
      <Typography 
        variant="body1" 
        sx={{ 
          color: 'text.primary',
          lineHeight: 1.6
        }}
      >
        {msg.text}
      </Typography>
    );
  }
  
  return msg.text;
};

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);

    try {
      const response = await axios.post('http://localhost:3001/api/chat', { message: userMessage });
      
      if (response.data.success) {
        // Add each result as a separate message
        response.data.results.forEach(result => {
          setMessages(prev => [...prev, { ...result, isUser: false }]);
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: 'Sorry, there was an error processing your request.', 
        isUser: false,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <PageContainer>
      <ChatContainer>
        {messages.map((msg, index) => (
          <MessageWrapper key={index} isuser={msg.isUser ? 'true' : 'false'}>
            <MessageContent isuser={msg.isUser ? 'true' : 'false'}>
              {msg.isUser !== true && (
                <MessageAvatar isuser={msg.isUser ? 'true' : 'false'}>
                  <SmartToyIcon />
                </MessageAvatar>
              )}
              <MessageBubble isuser={msg.isUser ? 'true' : 'false'}>
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
            onClick={handleSubmit}
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
