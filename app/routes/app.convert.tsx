import React, { useEffect, useState } from 'react';
import '../Convert.css'; 

function Convert() {
  // Initialize state to store information for each card (header and body)
  const [cards, setCards] = useState([
    { id: 1, header: "Hey [Customer's Name]!", body: "We noticed you left some great items in your cart. Don't worry, they're still here waiting for you! Come back and complete your purchase before they're group end. And just for you, we're offering a special discount of [X]% off on your cart. Use it " },
    { id: 2, header: "Hey [Customer's Name]!", body: "We noticed you left some great items in your cart. Don't worry, they're still here waiting for you! Come back and complete your purchase before they're group end. And just for you, we're offering a special discount of [X]% off on your cart. Use it" },
    { id: 3, header: "Hey [Customer's Name]!", body:"We noticed you left some great items in your cart. Don't worry, they're still here waiting for you! Come back and complete your purchase before they're group end. And just for you, we're offering a special discount of [X]% off on your cart. Use it`" },
    { id: 4, header: "Hey [Customer's Name]!", body: "We noticed you left some great items in your cart. Don't worry, they're still here waiting for you! Come back and complete your purchase before they're group end. And just for you, we're offering a special discount of [X]% off on your cart. Use it" }
  ]);

  // State to track the selected card
  const [selectedCard, setSelectedCard] = useState(null);
  const [isDataChanged,setIsDataChanged] = useState(false);
  const [saveData,setSaveData] = useState(false);

  const webhookUrl = "pubsub://sp-recovery-monkey:message";
  const data ={
    name:'helo'
  }

  useEffect(()=>{
    const storedCards = localStorage.getItem('cards');
    if(storedCards){
      setCards(JSON.parse(storedCards));
    }
  },[]);

  

  const sendDataToWebhook = () => {
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), 
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Successfully sent data to webhook:', data);
      alert('Data sent successfully');
    })
    .catch(error => {
      console.error('Error sending data to webhook:', error);
      alert('Failed to send data');
    });
  };

  // Function to handle card header change (editable input)
  const handleHeaderChange = (id, newHeader) => {
    setCards(cards.map(card =>
      card.id === id ? { ...card, header: newHeader } : card
    ));
    if(!isDataChanged){
      setIsDataChanged(true);
    }
  };

  // Function to handle card body change (editable input)
  const handleBodyChange = (id, newBody) => {
    setCards(cards.map(card =>
      card.id === id ? { ...card, body: newBody } : card
    ));
    if(!isDataChanged){
      setIsDataChanged(true);
    }
  };

  // Function to handle the selection of a card
  const handleSelectCard = (id) => {
    setSelectedCard(id);
    setSaveData(false)
  };

  // Function to log the selected card content to the console
  const handleSend = () => {
    if (selectedCard !== null) {
      const selectedBox = cards.find(card => card.id === selectedCard);
      
      console.log('Selected Box Header:', selectedBox.header);
      console.log('Selected Box Body:', selectedBox.body);
      setSaveData(false);
      sendDataToWebhook();
    } else {
      console.log('No card selected!');
    }
  };

  const handleSave =()=>{
    if(isDataChanged){
      localStorage.setItem('cards', JSON.stringify(cards));
      console.log('saves');
      setSaveData(true);
    }
    
  }



  return (
    <>
       <div className="connect_container">
            <div className="connect_main_card">
                <div className="connect_main_heading"><p>Let's Convert</p></div>
                <div className="connect_sub_heading"><p>Choose the right message that suits your customers</p></div>
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
                        <button className='connect_button' onClick={handleSave}>Save Data</button>
                    </div>
                    {saveData && <p style={{margin:'5px',color:' green'}}>Save data Successfully</p>}
                    <div className="connect_button_div">
                        <button className='connect_button' onClick={handleSend}>Send Data</button>
                    </div>
                </div>
            </div>
       </div>
    </>
  );
}

export default Convert;
