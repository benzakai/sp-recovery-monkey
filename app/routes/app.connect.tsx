import { useEffect, useState } from "react";
import '../Connect.css';



export default function Connect() {
  const [instances, setInstances] = useState([]);
  const [qrCode, setQRCode] = useState('');
  const [showNumbers,setShowNumbers] = useState(false);
  const [stateInstance,setStateInstance] = useState('notAuthorized');
  const [storeId ,setStoreId]= useState('');
  const [pubsubData,setPubsubData] = useState({});
  const [fetchphoneNumberData,setFetchPhoneNumberData] = useState({});

  const searchName = 'cartkeeper - il - 001 ';

  const handleNumbers = () => {
    const result = instances.find(item => item.name == searchName);
  
    if (result) {
      setPubsubData(prevState => {
        const updatedData = {
          ...prevState,
          greenAPIId: result.idInstance,
          storeId: storeId,
          phoneNumber: result.phone
        };
  
        console.log('Found:', result);
        sendDataToPubSub(updatedData); // Call the function with updated data
  
        return updatedData; // Return the updated state
      });
    } else {
      console.log('Not Found');
    }
  }
  const fetchPhoneNumber = async (phonedata)=>{
    const responsedata = await fetch('/api/fetchPhoneNumber',{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(phonedata)
    })
    const data = await responsedata.json();
    console.log('phone number api worked',data);
    return data;
  }
  

  

  const getLoaderDatawebhook =async()=>{
    const res = await fetch('/api/getGreenWebhookData');
    const responsedata = await res.json();
    if(responsedata?.data?.typeWebhook == 'stateInstanceChanged'){
      if(responsedata.data.stateInstance == 'authorized'){
        setStateInstance('authorized');
        console.log('number',fetchphoneNumberData);
        console.log('instnaces',instances);
        const storedData = localStorage.getItem('PhoneNumber');
        const parsedNumberData = JSON.parse(storedData);
        const phoneNumberAPIData = await fetchPhoneNumber(parsedNumberData);
        setPubsubData(prevState => {
          const updatedData = {
            ...prevState,
            greenAPIId: parsedNumberData?.id,
            storeId: phoneNumberAPIData?.storeId,
            phoneNumber: phoneNumberAPIData?.reponseData?.phone
          };
    
          console.log('data to send to pub sub:', updatedData);
          sendDataToPubSub(updatedData); // Call the function with updated data
    
          return updatedData; // Return the updated state
        });
      }
    }
    console.log('success',responsedata);
    
  }

  const sendDataToPubSub = async (dataTosend)=>{
    const response = await fetch('/api/sendPubSubData',{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataTosend)
    })
    const data = await response.json();
    console.log('sentpubsub dtaa',data);
    setStateInstance('authorized');
  }

  

  const getdtaa =async()=>{
    const res = await fetch('/api/getAuthstatus');
    const data = await res.json();
    console.log('succ',data);
    
  }
  // getdtaa();

  const fetchInstances = async () => {
    try {
      const response = await fetch('/api/getInstances');
      if (!response) {
        console.log('no instances');
      }
      const responsedata = await response.json();
      setInstances(responsedata.instances);
      console.log('instances:',responsedata.instances);
      
    } catch (error) {
      console.error('Error getting instances:', error);
    }
  };

  const getAuthStatus = async () => {
    try {
      for(let i=0; i<instances.length; i++){
        if(instances[i].status == 'notAuthorized'){
          fetchQR(instances[i].apiUrl,instances[i].idInstance,instances[i].apiTokenInstance)
          // console.log('id',instances[i].apiUrl,instances[i].idInstance,instances[i].apiTokenInstance);
          // sendDataToExpress(instances[i]);
          setFetchPhoneNumberData(prevState => {
            const updatedData = {
              ...prevState,
              url:instances[i].apiUrl,
              id:instances[i].idInstance,
              token:instances[i].apiTokenInstance
            };
            localStorage.setItem('PhoneNumber',JSON.stringify(updatedData));
      
            return updatedData; // Return the updated state
          });
          setPubsubData(prevState => ({
            ...prevState,
            greenAPIId: instances[i].idInstance,
            storeId:storeId
          }));
          
          break;
        }
      }
      
      
    } catch (error) {
      console.error('Error getting auth:', error);
    }
   };

  const fetchQR = async (url,id,token)=>{
      try {            
      const response = await fetch('/api/fetchQR',{
          method: 'POST',
          headers: {
          'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url,id,token })
      });
      const data = await response.json();
      console.log('data',data);
      
      if(data?.qrData.type == 'qrCode'){
          setQRCode(`data:image/png;base64,${data.qrData.message}`);
      }
      if(data?.storeId){
        setStoreId(data.storeId);
      }

      console.log('qr',data);
      
      } catch (error) {
      console.error('Error fetching QR code:', error);
      }
      
  }

  const sendDataToExpress =async (instance)=>{
    const response = await fetch('/api/sendExpressData',{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ instance })
    })
    const data = await response.json();
    console.log('sent',data);
    
  }

  useEffect(()=>{
    fetchInstances();
    
  },[]);

  useEffect(()=>{
    getAuthStatus();
  },[instances]);

  useEffect(() => {
    // Start polling every 3 seconds until stateInstance is 'authorized'
    if (stateInstance !== 'authorized') {
      const interval = setInterval(() => {
        getLoaderDatawebhook();        
      }, 3000);

      // Clean up the interval when component unmounts or when stateInstance becomes 'authorized'
      return () => clearInterval(interval);
    }
  }, [stateInstance]);

  return (
    <div style={{display:'flex',justifyContent:'center'}}>
      <div className="main-container">
        <div className="main-heading"><p>Let's Connect</p></div>
        <div className="connect-container">
           {stateInstance === 'authorized' ? (
              <div style={{fontWeight:'bold'}}>You Are Successfully Authorized</div>
            ) : (
              <>
                <div className="qr-code-section">
                  <div><p style={{fontWeight:'bold'}}>Scan the Qr-code to present the dialogs on your own device. </p></div>
                  <div>
                    {qrCode && <img src={qrCode} alt="QR Code" />}
                  </div>
                </div>

                <div className="vertical-line"></div>

                <div className="get-number-section">
                  <div>
                    {showNumbers ?(
                      <p style={{fontWeight:'bold'}}>Choose a ID</p>
                    ):(
                      <p style={{fontWeight:'bold'}}>Get a new number for your store</p>
                    )}
                  </div>
                  <div className="get-number-div">
                      
                      
                      
                          <button className="get-number-button" onClick={handleNumbers}>Get New Number</button>

                      
                  </div>
                </div>
              </>
            )}
          
        </div>
      </div>
    </div>

  );
}
