import { useState, useEffect, useRef } from 'react';

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const chatContainerRef = useRef(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage = { text: inputText, sender: 'user' };
    setMessages([...messages, newMessage]);
    setInputText('');

    try {
      // **Important:** Replace 'YOUR_GEMINI_API_KEY' with your actual API key.
      const apiKey = "AIzaSyBkdC2b1o_ICtGEAjbyEMPaQmV7JXK9uHs";
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: inputText }],
          }],
        }),
      });

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        const errorData = await response.json();
        console.error('Error details:', errorData);
        setMessages(prevMessages => [
          ...prevMessages,
          { text: 'Sorry, there was an error communicating with the AI.', sender: 'bot', error: true },
        ]);
        return;
      }

      const data = await response.json();
      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (botResponse) {
        setMessages(prevMessages => [
          ...prevMessages,
          { text: botResponse, sender: 'bot' },
        ]);
      } else {
        setMessages(prevMessages => [
          ...prevMessages,
          { text: 'The AI did not provide a response.', sender: 'bot', error: true },
        ]);
      }
    } catch (error) {
      console.error('There was an error sending the message:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { text: 'Sorry, there was an error communicating with the AI.', sender: 'bot', error: true },
      ]);
    }
  };

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    // Scroll to the bottom of the chat container when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chatbot-container" style={styles.container}>
      <div ref={chatContainerRef} className="chat-messages" style={styles.messages}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender}`}
            style={message.sender === 'user' ? styles.userMessage : styles.botMessage}
          >
            {message.text}
            {message.error && <span style={styles.errorMessage}> (Error)</span>}
          </div>
        ))}
      </div>
      <div className="input-area" style={styles.inputArea}>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.button}>Send</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '400px',
    width: '300px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  messages: {
    flexGrow: 1,
    padding: '10px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  userMessage: {
    backgroundColor: '#DCF8C6',
    color: '#111',
    padding: '8px 12px',
    borderRadius: '8px',
    alignSelf: 'flex-end',
    marginBottom: '8px',
    wordBreak: 'break-word',
  },
  botMessage: {
    backgroundColor: '#E0E0E0',
    color: '#111',
    padding: '8px 12px',
    borderRadius: '8px',
    alignSelf: 'flex-start',
    marginBottom: '8px',
    wordBreak: 'break-word',
  },
  errorMessage: {
    color: 'red',
    fontSize: '0.8em',
    marginLeft: '5px',
  },
  inputArea: {
    display: 'flex',
    padding: '10px',
    borderTop: '1px solid #ccc',
  },
  input: {
    flexGrow: 1,
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginRight: '10px',
  },
  button: {
    padding: '8px 15px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#007BFF',
    color: 'white',
    cursor: 'pointer',
  },
};

export default Chatbot;