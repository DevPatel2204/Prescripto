// ChatbotPopover.js
import { useState, useEffect, useRef } from 'react';
import ChatbotContent from './ChatbotContent';
import { ChatIcon, CloseIcon } from './Icons'; // Assuming you have these icons
import './Chatbot.css'; // Import the styles

function ChatbotPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Optional: Close the popover if clicking outside of it
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      // Check if the click is outside the popover AND outside the trigger button
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Clean up the event listener
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]); // Re-run effect when isOpen changes


  return (
    <>
      {/* The Chat Window (Popover) */}
      {/* Apply 'open' class conditionally for transition */}
      <div
        ref={popoverRef}
        className={`chatbot-popover-window ${isOpen ? 'open' : ''}`}
        aria-hidden={!isOpen} // Accessibility: hide from screen readers when closed
      >
        {/* Render ChatbotContent only when isOpen to potentially save resources
            and ensure useEffects run correctly on open */}
        {isOpen && <ChatbotContent onClose={toggleChat} />}
      </div>

      {/* The Trigger Button */}
      <button
        ref={buttonRef}
        className="chatbot-trigger-button"
        onClick={toggleChat}
        aria-label={isOpen ? "Close Chat" : "Open Chat"}
        aria-expanded={isOpen} // Accessibility: indicates the controlled element's state
      >
        {/* Show Close icon when open, Chat icon when closed */}
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>
    </>
  );
}

export default ChatbotPopover;