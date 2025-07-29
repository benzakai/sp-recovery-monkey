import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { iconsClasses, iconsUrl, getBubblePosition } from './utils/constants';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [showBubble, setShowBubble] = useState(false);
  const [aiSettings, setAISettings] = useState(null)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen && imageLoaded) setShowBubble(true);
    }, 20000);

    return () => clearTimeout(timer);
  }, [isOpen, imageLoaded]);


  useEffect(() => {
    if (isOpen) {
      setShowBubble(false);
    }
  }, [isOpen]);

  // useEffect(() => { // for hiding a bubble in few seconds
  //   if (showBubble) {
  //     const hideTimer = setTimeout(() => setShowBubble(false), 20000);
  //     return () => clearTimeout(hideTimer);
  //   }
  // }, [showBubble]);

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

  async function getAiChatbotSettings() {
    try {
      const response = await fetch('/apps/external-live/api/extGetAIChatbotSettings');
      if (!response.ok) {
        throw new Error('Failed to fetch AI chatbot settings');
      }
      const data = await response.json();
      // console.log('AI Chatbot Settings:', data);
      setAISettings(data?.settings);
    } catch (error) {
      console.error('Error fetching AI chatbot settings:', error);
    } finally {
      setIsLoading(false);
    }
  }


  useEffect(() => {
    console.log('last update on... 24-07-25 6:56');
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
      getAiChatbotSettings();
    } catch (error) {
      console.error('Error initializing chat session:', error);
      return;
    }
  }, []);

  useEffect(() => {
    async function handleMessage(event) {
      // console.log("event", event)
      // if (event.origin !== 'https://connect.cartkeeper.co') {
      //   return;
      // }
      if (typeof event.data !== 'object' || !event.data.type) {
        return;
      }

      const { type, payload } = event.data;
      const productId = payload?.id;

      switch (type) {
        case 'PRODUCT':
          if (productId) {
            await redirectToProductPage(productId)

          }
          break;

        case 'ADD_TO_CART':
          if (productId) {
            await addPrductToCart(productId)
          }
          break;
        default:
          break;
      }
    }

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const redirectToProductPage = async (productId) => {
    if (!productId) return console.log("product id not found on redirectToProductPage")
    try {
      const response = await fetch(`/apps/external-live/api/extGetProductDetails`, {
        method: "POST",
        body: JSON.stringify({ productId })
      })
      if (!response.ok) {
        throw new Error("error on response of product fetch", response.statusText)
      }
      const data = await response.json()
      console.log("data =================>", data)
      const productHandle = data?.productData?.product?.handle
      console.log("productHandle", productHandle)
      if (productHandle) {
        window.location.href = `https://${location.host}/products/${productHandle}`;
      }
    } catch (error) {
      console.log("error occured on redirectToProductPage", error)
    }
  }

  const addPrductToCart = async (pId) => {
    if (!pId) return console.log("product id not found on add to cart")
    try {
      const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: pId,
          quantity: 1
        })
      })

      if (!response.ok) {
        throw new Error("error while adding product to cart", response.statusText)
      }
      const data = await response.json()
      console.log('product added to cart:', data);
      window.location.href = `https://${location.host}/cart`
    } catch (error) {
      console.error('error adding to cart:', error);
    }
  }

  return (
    (isLoading ? <></> :
      <div className={iconsClasses[aiSettings?.iconPosition] || 'bottom-right'}>
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
              src={iconsUrl[aiSettings?.iconStyle] || "https://app.cartkeeper.co/images/chatWidget/icons/extension/chatIconStyle1.png"}
              alt="Chat Icon"
              className="chat-img"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}
        </button>

        {showBubble && (
          <div className="chat-bubble" style={getBubblePosition(aiSettings?.iconPosition || 'position2')}>
            <span>You can ask me anything!</span>
          </div>
        )}

        {
          isOpen && chatId && (
            <div className="iframe-container">
              <iframe
                className="iframe-ele"
                src={`https://connect.cartkeeper.co/public-chat/${Shopify.shop}/${chatId}`}
                title="AI Chat"
              ></iframe>
            </div>
          )
        }
      </div >)
  );
}

export default App;
