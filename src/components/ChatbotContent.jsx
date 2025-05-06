// ChatbotContent.js
import React, { useState, useEffect, useRef } from 'react';
import { SendIcon, CloseIcon } from './Icons'; // Import icons
import './Chatbot.css'; // Import shared styles

// IMPORTANT: NEVER expose your API key in client-side code like this in production!
// Use a backend proxy or serverless function to handle API calls securely.
const API_KEY = "AIzaSyBkdC2b1o_ICtGEAjbyEMPaQmV7JXK9uHs"; // Replace with your key FOR TESTING ONLY
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Define the system prompt
const SYSTEM_PROMPT = `
You are an AI assistant specialized in providing information ONLY on medical and health-related topics.
Your knowledge covers symptoms, diseases, treatments, medications, general wellness, nutrition, and basic medical terminology.
Answer only questions directly related to these medical topics.
If a user asks a question outside of the medical and health domain (e.g., about history, programming, general knowledge, opinions, etc.), you MUST politely refuse to answer.
When refusing, state clearly that your function is limited to medical queries. For example, say: "I specialize in medical and health topics. I cannot answer questions outside of that scope. How can I help you with a health-related query?"
Do not engage in conversations unrelated to health. Be concise and informative in your medical answers.
Do not provide medical advice, diagnosis, or treatment recommendations. Always advise users to consult with a qualified healthcare professional for personal health concerns.
`;

// eslint-disable-next-line react/prop-types
function ChatbotContent({ onClose }) {
  // Update the initial welcome message
  const [messages, setMessages] = useState([
    { text: "Hello! I'm a medical information assistant. Ask me about health topics, symptoms, or general wellness. Remember to consult a doctor for personal advice.", sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  const sendMessage = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput || isLoading) return;

    const newMessage = { text: trimmedInput, sender: 'user' };
    // Add user message to state *before* sending API call
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputText('');
    setIsLoading(true);

    // Prepare conversation history for the API
    // Map messages state to the format expected by the API's 'contents' field
    const conversationHistory = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model', // Gemini uses 'model' for bot responses
      parts: [{ text: msg.text }]
    }));

    // Add the *new* user message to the history being sent
    const currentContent = {
        role: 'user',
        parts: [{ text: trimmedInput }]
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Combine history with the current message
          contents: [...conversationHistory, currentContent],
          // Add the system instruction
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          // Optional safety settings (adjust as needed)
          safetySettings: [
             { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
             { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
             { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
             { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
             // Be cautious with MEDICAL safety category if you *want* medical info
             // { category: "HARM_CATEGORY_MEDICAL", threshold: "BLOCK_ONLY_HIGH" },
          ],
          // generationConfig: { // Optional: configure output
          //   temperature: 0.7,
          //   topK: 1,
          //   topP: 1,
          //   maxOutputTokens: 2048,
          // }
        }),
      });

      setIsLoading(false); // Set loading to false *after* fetch returns

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`HTTP error! status: ${response.status}`, errorData);
        throw new Error(`API Error: ${errorData?.error?.message || response.statusText}`);
      }

      const data = await response.json();
      // console.log("API Response:", data); // Debugging

      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const blockReason = data.candidates?.[0]?.finishReason === 'SAFETY' || data.promptFeedback?.blockReason;

      if (botResponse) {
        setMessages(prevMessages => [
          ...prevMessages,
          { text: botResponse, sender: 'bot' },
        ]);
      } else if (blockReason) {
         console.warn(`Content blocked due to: ${data.promptFeedback?.blockReason || 'Safety Filter'}`);
         setMessages(prevMessages => [
           ...prevMessages,
           { text: `I cannot provide a response due to safety guidelines. Please try rephrasing your query.`, sender: 'bot', error: true },
         ]);
      }
       else {
        console.error('Unexpected API response structure:', data);
        setMessages(prevMessages => [
          ...prevMessages,
          { text: 'Sorry, I received an empty or unexpected response from the AI.', sender: 'bot', error: true },
        ]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false); // Ensure loading is false on error
      setMessages(prevMessages => [
        ...prevMessages,
        { text: `Sorry, there was an error: ${error.message || 'Network issue'}. Please try again.`, sender: 'bot', error: true },
      ]);
    } finally {
       // Refocus input after sending/receiving or error
       inputRef.current?.focus();
    }
  };

  // (Keep handleInputChange, handleKeyDown, useEffects as they were)
  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);


  return (
    <div className="chatbot-content">
      {/* Header */}
      <div className="chatbot-header">
        <span className="chatbot-header-title">Medical AI Assistant</span> {/* Updated Title */}
        <button onClick={onClose} className="chatbot-close-button" aria-label="Close Chat">
          <CloseIcon />
        </button>
      </div>

      {/* Messages Area */}
      <div ref={chatContainerRef} className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender} ${message.error ? 'error' : ''}`}
          >
            {/* Basic markdown rendering (e.g., for newlines - replace \n with <br>) */}
            {message.text.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < message.text.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <i>Typing...</i>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a medical question..." // Updated placeholder
          className="input-field"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          className="send-button"
          disabled={!inputText.trim() || isLoading}
          aria-label="Send Message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

export default ChatbotContent;