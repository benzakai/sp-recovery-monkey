import { useEffect, useState } from "react";
import '../Connect.css';
import { Card, Page } from "@shopify/polaris";

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
  const topics = ['message'];

  const handleNumbers = async () => {
    const result = instances.find(item => item.name === searchName);
    if (result) {
      setButtonData({
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

      await sendDataToPubSub(pubsubUpdate);
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
    return data;
  };

  const sendDataToPubSub = async (message) => {
    const topicNames = topics;
    const response = await fetch('/api/sendPubSubData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, topicNames }),
    });

    const data = await response.json();
    setStateInstance('authorized');
  };

  const setDataInFirestore = async (collectionName, documentName, data) => {
    const response = await fetch('/api/firestore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collectionName, documentName, data }),
    });

    const Responsedata = await response.json();
  }

  const fetchInstances = async () => {
    try {
      const response = await fetch('/api/getInstances');
      const data = await response.json();
      setInstances(data.instances);
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
        
        setStateInstance('authorized');
        const phoneNumberData = await fetchPhoneNumber(currentQRData);
        setPubsubData(async (prevState) => {
          const updatedData = {
            ...prevState,
            greenAPIId: currentQRData.id,
            storeId: phoneNumberData?.storeId,
            phoneNumber: phoneNumberData?.reponseData?.phone,
            greenAPIKey: currentQRData?.token,
            greenAPIUrl: currentQRData?.url,
          };

          await sendDataToPubSub(updatedData);
          await setDataInFirestore('ConnectPagedata', `${updatedData?.storeId}`, updatedData)

          return updatedData;
        });

      }
      if (data.storeId) setStoreId(data.storeId);
    } catch (error) {
      console.error('error', error);
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
  };

  const getDataFromFirestore = async () => {
    const response = await fetch('/api/firestore?collectionName=ConnectPagedata', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const Responsedata = await response.json();
    if (Responsedata.data) {
      return Responsedata.data;
    } else {
      return null;
    }
  };

  const getInstanceState = async (url, id, token) => {
    try {
      const response = await fetch('/api/getInstanceStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, id, token }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching instance status:', error);
      return {};
    }
  }

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

    const getFireData = async () => {
      const fireStoreData = await getDataFromFirestore();

      if (Object.keys(fireStoreData).length === 0) {
        initializeFlow();
      } else {
        const stateInstanceData = await getInstanceState(fireStoreData?.greenAPIUrl, fireStoreData?.greenAPIId, fireStoreData?.greenAPIKey);

        if (stateInstanceData?.responseData?.stateInstance == 'authorized') {
          setStateInstance('authorized');
        } else if (stateInstanceData?.responseData?.stateInstance == 'notAuthorized') {
          let emptyObject = {};
          let storeId = stateInstanceData?.storeId;
          await setDataInFirestore('ConnectPagedata', storeId, emptyObject);
        } else {
          initializeFlow();
        }
      }
    }

    getFireData();
  }, [instances.length, currentQRData]);

  useEffect(() => {
    let intervalId;
    if (stateInstance !== 'authorized' && currentQRData.url && currentQRData.id && currentQRData.token) {
      intervalId = setInterval(() => {
        fetchQR(currentQRData.url, currentQRData.id, currentQRData.token);
      }, 3000);
    }
    return () => clearInterval(intervalId);
  }, [stateInstance, currentQRData]);

  return (
    <Page>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="main-container">
            <div className="main-heading"><p>Let's Connect</p></div>
            <div className="connect-container">
              {stateInstance === 'authorized' ? (
                <div>
                  <div style={{ fontWeight: 'bold' }}>your device is already connected</div>
                  <div style={{ fontWeight: 'bold' }}>you should easily send and recieve whatsapp messages</div>
                </div>
              ) : (
                <>
                  <div className="qr-code-section">
                    <p style={{ fontWeight: 'bold' }}>Scan the QR code to present the dialogs on your own device.</p>
                    {qrCode ? (
                      <img src={qrCode} alt="QR Code" />
                    ) : (
                      <div className="spinner"></div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Page>
  );
}
