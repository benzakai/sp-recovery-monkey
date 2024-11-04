import React, { useEffect, useState } from 'react';
import '../Convert.css'; 



function Convert() {
  const [cards, setCards] = useState([
    { id: 1, header: "Hi [Customer’s Name]", body: "it looks like you left some items in your cart! Just a heads-up, our stock is moving fast, so grab them while you can 🎯. If you need any assistance, feel free to reach out! [link to abandon cart recovery]" },
    { id: 2, header: "Hi [Customer’s Name]", body: "we noticed you left some items in your cart. If you have any questions about the products or need help finding the right fit, we’re here to assist you 😊. Let us know how we can help! [link to abandon cart recovery]" },
    { id: 3, header: "Hey [Customer’s Name]", body: "we saw you left your cart behind 🛒! Some of the items in your cart are low in stock, so it’s a good idea to complete your purchase soon. Let us know if you need any assistance. [link to abandon cart recovery]" },
    { id: 4, header: "👀 Hey [Customer’s Name]", body: "we noticed you disappeared with a full cart – don’t worry, your secret’s safe with us! 😜 But if you’re still interested, your items are waiting for you… and if you need any help, we’ve got you covered! 😎" }
  ]);

  const [selectedCard, setSelectedCard] = useState(null);
  const [isDataChanged, setIsDataChanged] = useState(false);
  const [isSuccessMessageVisible, setIsSuccessMessageVisible] = useState(false);
  const [greenAPIData,setGreenAPIData] = useState([]);
  const topics =['message'];
 

  useEffect(() => {
    const storedCards = localStorage.getItem('cards');
    if (storedCards) {
      setCards(JSON.parse(storedCards));
    }
    getDataFromFirestore();
  }, []);

  const getDataFromFirestore = async () => {
    const response = await fetch('/api/firestore?collectionName=ConnectPagedata', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const Responsedata = await response.json();
    if(Responsedata.data.length > 0){
      // Filter out the empty objects
      const storeId = Responsedata.storeId; // Assuming Responsedata contains storeId
      const filteredData = Responsedata.data.filter(item => 
          Object.keys(item).length > 0 && item.storeId == storeId
      );
       console.log('filteredData',filteredData);
       setGreenAPIData(filteredData); 

    }
    console.log('Getting Firestore data:', Responsedata);
  };

  const handleHeaderChange = (id, newHeader) => {
    setCards(cards.map(card =>
      card.id === id ? { ...card, header: newHeader } : card
    ));
    if (!isDataChanged) {
      setIsDataChanged(true);
    }
  };

  const handleBodyChange = (id, newBody) => {
    setCards(cards.map(card =>
      card.id === id ? { ...card, body: newBody } : card
    ));
    if (!isDataChanged) {
      setIsDataChanged(true);
    }
  };

  const handleSelectCard = (id) => {
    setSelectedCard(id);
  };

  const handleSaveAndSend = async () => {
    if (isDataChanged) {
      localStorage.setItem('cards', JSON.stringify(cards));
    }

    if (selectedCard !== null) {
      const selectedBox = cards.find(card => card.id === selectedCard);
      console.log('Selected Box Header:', selectedBox.header);
      console.log('Selected Box Body:', selectedBox.body);
      
      try {
        if(greenAPIData){
           console.log('greenAPIData',greenAPIData);
           const combinedObject = { ...selectedBox, ...greenAPIData };
           console.log('combinedObject',combinedObject);
           await sendDataToPubSub(combinedObject);
        }else{
          await sendDataToPubSub(selectedBox);
        }
        console.log('Successfully sent data to webhook');
        setIsSuccessMessageVisible(true);
        setTimeout(() => setIsSuccessMessageVisible(false), 3000); 
      } catch (error) {
        console.error('Error sending data to webhook:', error);
        alert('Failed to send data');
      }
    } else {
      console.log('No card selected!');
    }
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
    console.log('Sent convert data:', data);
  };

  return (
    <>
      <div className="connect_container">
        <div className="connect_main_card">
          <div className="connect_main_heading"><div>Let's Convert</div></div>
          <div className="connect_sub_heading"><div>Choose the right message that suits your customers</div></div>
          <div className="connect_App">
            <div className="connect_card_container">
              {cards.map(card => (
                <div
                  key={card.id}
                  className={`connect_card ${selectedCard === card.id ? 'connect_selected' : ''}`}
                  onClick={() => handleSelectCard(card.id)}
                >
                  <div className='connect_card_header_div'>
                    <textarea
                      className="connect_card_header"
                      value={card.header}
                      onChange={(e) => handleHeaderChange(card.id, e.target.value)}
                      placeholder="Card Header"
                    />
                    <div className='connect_icon'><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/></svg></div>
                  </div>
                  <textarea
                    className="connect_card_body"
                    value={card.body}
                    onChange={(e) => handleBodyChange(card.id, e.target.value)}
                    placeholder="Card Body"
                  />
                </div>
              ))}
            </div>
            <div className="connect_button_div">
              <button className='connect_button' onClick={handleSaveAndSend}>Save Text</button>
              {isSuccessMessageVisible && <div style={{ margin: '5px 0', color: 'green' }}>Data saved and sent successfully</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Convert;
