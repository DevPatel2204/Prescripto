 import { useState, useEffect } from 'react';
import Chatbot from './AI_bot';


function FloatingCircle() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // You can add logic here to control when the pop-up appears
    // For example, show it after a short delay:
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500); // Show after 1.5 seconds

    return () => clearTimeout(timer); // Cleanup the timer
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.circle}>
        <span style={styles.text}>Hello!</span>
        <button onClick={handleClose} style={styles.closeButton}>
          <Chatbot />
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000, // Ensure it's on top of other elements
  },
  circle: {
    backgroundColor: '#007BFF',
    color: 'white',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    position: 'relative',
  },
  text: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    fontSize: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    padding: 0,
  },
};

export default FloatingCircle;