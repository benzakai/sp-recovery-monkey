import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';


function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [chatId, setChatId] = useState(null);

  const toggleIframe = () => {
    setIsOpen((prev) => !prev);
  };

  function getChatSessionId(shopId, customerId) {
    if (!customerId) {
      const guestKey = `guestChatId_${shopId}`;
      let guestChatId = localStorage.getItem(guestKey);
      if (!guestChatId) {
        guestChatId = uuidv4();
        localStorage.setItem(guestKey, guestChatId);
      }
      return guestChatId;
    } else {
      const key = `chatId_${shopId}_${customerId}`;
      let storedId = localStorage.getItem(key);
      if (!storedId) {
        storedId = uuidv4();
        localStorage.setItem(key, storedId);
      }
      return storedId;
    }
  }


  useEffect(() => {
    console.log('Initializing chat session... 16-5:55');
    const shopId = Shopify?.shop;
    const customerId = ShopifyAnalytics.meta.page.customerId;

    if (!shopId) {
      console.error('Shop ID is not available.');
      return;
    }
    // if (!customerId) {
    //   console.warn('Customer ID is not available, using guest session.');
    // }

    try {
      const userID = getChatSessionId(shopId, customerId)
      setChatId(userID);
    } catch (error) {
      console.error('Error initializing chat session:', error);
      return;
    }
  }, []);

  // useEffect(() => {
  //   console.log('Chat ID initialized:', `https://connect.cartkeeper.co/public-chat/${Shopify.shop}/${chatId}`);
  // }, [chatId]);

  return (
    <div className="root">
      <button
        className="message-icon"
        style={{
          ...(isOpen || (imageLoaded && !imageError) ? {} : { display: 'none' }),
        }}
        onClick={toggleIframe}
        aria-label="Toggle chat"
      >
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

      {isOpen && chatId && (
        <div className="iframe-container">
          <iframe
            className="iframe-ele"
            src={`https://connect.cartkeeper.co/public-chat/${Shopify.shop}/${chatId}`}
            title="AI Chat"
          ></iframe>
        </div>
      )}
    </div>
  );
}

export default App;
