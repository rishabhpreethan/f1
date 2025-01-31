import React, { useState } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
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

const extractEchartsOptions = (content) => {
  try {
    // Try to extract content from markdown code block
    const match = content.match(/```echarts\n([\s\S]*?)\n```/);
    if (match && match[1]) {
      const optionsStr = match[1].trim();
      
      // Handle case where the string starts with "option = "
      if (optionsStr.startsWith('option = ')) {
        const jsonStr = optionsStr.replace('option = ', '');
        return JSON.parse(jsonStr);
      }
      
      // Try parsing as direct JSON
      return JSON.parse(optionsStr);
    }
    
    // If no markdown block found, try parsing the entire content as JSON
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse ECharts options:', error);
    console.log('Content received:', content);
    return null;
  }
};

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { 
      role: 'user', 
      content: {
        text: input,
        isResponse: true
      }
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Get the initial response
      const { data } = await axios.post('http://localhost:3001/api/chat', { prompt: input });
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add text response
      const assistantMessage = { 
        role: 'assistant', 
        content: {
          text: data.response,
          isResponse: true
        }
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Generate ECharts options if we have query results
      if (data.queryResult) {
        try {
          const echartsResponse = await axios.post('http://localhost:3001/api/generate-echarts', { 
            queryResult: data.queryResult 
          });
          
          if (echartsResponse.data.success) {
            const echartsOptions = extractEchartsOptions(echartsResponse.data.data);
            if (echartsOptions) {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'chart',
                chartOptions: echartsOptions
              }]);
            }
          }
        } catch (chartError) {
          console.error('Error generating chart:', chartError);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to get response. Please try again.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: {
          text: 'Sorry, I encountered an error while processing your request. Please try again.',
          isResponse: true
        }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const MessageItem = ({ message }) => {
    const isUser = message.role === 'user';

    if (message.content === 'chart' && message.chartOptions) {
      return (
        <MessageWrapper>
          <MessageContent>
            <Box sx={{ width: '100%', height: '400px' }}>
              <ReactECharts option={message.chartOptions} style={{ height: '100%' }} />
            </Box>
          </MessageContent>
        </MessageWrapper>
      );
    }

    return (
      <MessageWrapper isuser={isUser ? 'true' : 'false'}>
        <MessageContent isuser={isUser ? 'true' : 'false'}>
          <MessageAvatar isuser={isUser ? 'true' : 'false'}>
            {isUser ? <PersonIcon /> : <SmartToyIcon />}
          </MessageAvatar>
          <MessageBubble isuser={isUser ? 'true' : 'false'}>
            <MessageText>
              {formatMessage(message.content)}
            </MessageText>
          </MessageBubble>
        </MessageContent>
      </MessageWrapper>
    );
  };

  return (
    <PageContainer>
      <ChatContainer>
        {messages.map((msg, index) => (
          <MessageItem key={index} message={msg} />
        ))}
      </ChatContainer>
      
      <InputContainer>
        <InputWrapper>
          <StyledTextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Send a message..."
            disabled={loading}
          />
          <SendButton
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : (
              <RotatingIcon hastext={input.trim() ? 'true' : 'false'} />
            )}
          </SendButton>
        </InputWrapper>
      </InputContainer>
    </PageContainer>
  );
};

export default Chat;
