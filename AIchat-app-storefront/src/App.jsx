import { useEffect, useState } from 'react';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const toggleIframe = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    console.log('extension updated on jun3-4:03',Shopify.shop);
  }
  , []);

  return (
    <div className="root">
      <button className="message-icon" style={{ ...(isOpen || (imageLoaded && !imageError) ? {} : { display: 'none' }) }} onClick={toggleIframe} aria-label="Toggle chat">
        {isOpen ? (
          <span className="close-icon">×</span>
        ) : (
          <img
            src="https://app.cartkeeper.co/images/chatIcon.svg"
            alt="Chat Icon"
            className="chat-img"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
      </button>

      {isOpen && (
        <div className="iframe-container">
          <iframe
            className="iframe-ele"
            src={`https://connect.cartkeeper.co/public-chat/${Shopify.shop}`}
            title="AI Chat"
          ></iframe>
        </div>
      )}
    </div>
  );
}

export default App;
