import { useEffect, useState } from "react";
import '../Connect.css';

export default function Connect() {
  const [instances, setInstances] = useState([]);
  const [qrCode, setQRCode] = useState('');
  const [showNumbers, setShowNumbers] = useState(false);
  const [stateInstance, setStateInstance] = useState('notAuthorized');
  const [storeId, setStoreId] = useState('');
  const [pubsubData, setPubsubData] = useState({});
  const [currentQRData, setCurrentQRData] = useState({});
  const [buttonData, setButtonData] = useState({});
  
  const searchName = 'cartkeeper - il - 001 ';

  const handleNumbers = async () => {
    const result = instances.find(item => item.name === searchName);
    if (result) {
      setButtonData({
        url: result.apiUrl,
        id: result.idInstance,
        token: result.apiTokenInstance,
      });
      console.log('Updated button data:', {
        url: result.apiUrl,
        id: result.idInstance,
        token: result.apiTokenInstance,
      });
      
      await sendDataToExpress({
        url: result.apiUrl,
        id: result.idInstance,
        token: result.apiTokenInstance,
      });

      const pubsubUpdate = {
        greenAPIId: result.idInstance,
        storeId: storeId,
        phoneNumber: result.phone,
      };
      setPubsubData(pubsubUpdate);
      console.log('Updated pubData:', pubsubUpdate);

      // await sendDataToPubSub(pubsubUpdate);
    } else {
      console.log('Instance not found');
    }
  };

  const fetchPhoneNumber = async (phonedata) => {
    const response = await fetch('/api/fetchPhoneNumber', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(phonedata),
    });
    const data = await response.json();
    console.log('Phone number API response:', data);
    return data;
  };

  const sendDataToPubSub = async (dataToSend) => {
    const response = await fetch('/api/sendPubSubData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });
    const data = await response.json();
    console.log('Sent pubsub data:', data);
    setStateInstance('authorized');
  };

  const fetchInstances = async () => {
    try {
      const response = await fetch('/api/getInstances');
      const data = await response.json();
      setInstances(data.instances);
      console.log('Fetched instances:', data.instances);
    } catch (error) {
      console.error('Error fetching instances:', error);
    }
  };

  const getAuthStatus = async () => {
    const unauthorizedInstance = instances.find(instance => instance.status === 'notAuthorized');
    if (unauthorizedInstance) {
      setCurrentQRData({
        url: unauthorizedInstance.apiUrl,
        id: unauthorizedInstance.idInstance,
        token: unauthorizedInstance.apiTokenInstance,
      });
    }
  };

  const fetchQR = async (url, id, token) => {
    try {
      const response = await fetch('/api/fetchQR', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, id, token }),
      });
      const data = await response.json();
      if (data.qrData?.type === 'qrCode') {
        setQRCode(`data:image/png;base64,${data.qrData.message}`);
      } else if (data.qrData?.type === 'alreadyLogged') {
        console.log('Already logged in');
        setStateInstance('authorized');
        const phoneNumberData = await fetchPhoneNumber(currentQRData);
        setPubsubData({
          greenAPIId: currentQRData.id,
          storeId: phoneNumberData?.storeId,
          phoneNumber: phoneNumberData?.responseData?.phone,
        });
        console.log('currentQRData',currentQRData);
        
        await sendDataToExpress(currentQRData);
        // await sendDataToPubSub(pubsubData);
      }
      if (data.storeId) setStoreId(data.storeId);
    } catch (error) {
      console.error('Error fetching QR code:', error);
    }
  };

  const sendDataToExpress = async (instance) => {
    const response = await fetch('/api/sendExpressData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instance }),
    });
    const data = await response.json();
    console.log('Sent to Express:', data);
  };

  useEffect(() => {
    const initializeFlow = async () => {
      await fetchInstances();
      if (instances.length > 0) {
        await getAuthStatus();
        if (currentQRData.url && currentQRData.id && currentQRData.token) {
          await fetchQR(currentQRData.url, currentQRData.id, currentQRData.token);
        }
      }
    };
    initializeFlow();
  }, [instances.length, currentQRData]);

  useEffect(() => {
    let intervalId;
    if (stateInstance !== 'authorized' && currentQRData.url && currentQRData.id && currentQRData.token) {
      intervalId = setInterval(() => {
        fetchQR(currentQRData.url, currentQRData.id, currentQRData.token);
      }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(intervalId);
  }, [stateInstance, currentQRData]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="main-container">
        <div className="main-heading"><p>Let's Connect</p></div>
        <div className="connect-container">
          {stateInstance === 'authorized' ? (
            <div style={{ fontWeight: 'bold' }}>You Are Successfully Authorized</div>
          ) : (
            <>
              <div className="qr-code-section">
                <p style={{ fontWeight: 'bold' }}>Scan the QR code to present the dialogs on your own device.</p>
                {qrCode && <img src={qrCode} alt="QR Code" />}
              </div>
              <div className="vertical-line"></div>
              <div className="get-number-section">
                <p style={{ fontWeight: 'bold' }}>
                  {showNumbers ? 'Choose an ID' : 'Get a new number for your store'}
                </p>
                <button className="get-number-button" onClick={handleNumbers}>Get New Number</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
