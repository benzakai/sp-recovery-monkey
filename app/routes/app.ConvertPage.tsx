import { Button, Card, Page, Text, TextField } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import '../Convert.css';


const ConvertPage = () => {
    const [cards, setCards] = useState([
        { id: 1, header: "Hi [Customer’s Name]", body: "it looks like you left some items in your cart! Just a heads-up, our stock is moving fast, so grab them while you can 🎯. If you need any assistance, feel free to reach out! [link to abandon cart recovery]" },
        { id: 2, header: "Hi [Customer’s Name]", body: "we noticed you left some items in your cart. If you have any questions about the products or need help finding the right fit, we’re here to assist you 😊. Let us know how we can help! [link to abandon cart recovery]" },
        { id: 3, header: "Hey [Customer’s Name]", body: "we saw you left your cart behind 🛒! Some of the items in your cart are low in stock, so it’s a good idea to complete your purchase soon. Let us know if you need any assistance. [link to abandon cart recovery]" },
        { id: 4, header: "👀 Hey [Customer’s Name]", body: "we noticed you disappeared with a full cart – don’t worry, your secret’s safe with us! 😜 But if you’re still interested, your items are waiting for you… and if you need any help, we’ve got you covered! 😎" }
    ]);

    const [selectedCard, setSelectedCard] = useState(null);
    const [isDataChanged, setIsDataChanged] = useState(false);
    const [isSuccessMessageVisible, setIsSuccessMessageVisible] = useState(false);
    const [greenAPIData, setGreenAPIData] = useState([]);
    const topics = ['message'];


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
        if(Object.keys(Responsedata).length > 0){
            if (Object.keys(Responsedata?.data).length > 0) {
                // Filter out the empty objects
                // const storeId = Responsedata.storeId; 
                const filteredData = Responsedata?.data;
                console.log('filteredData', filteredData);
                setGreenAPIData(filteredData);
    
            }else{
                console.log('No data found in Firestore');
            }
        }else{
            console.log('No data found in Firestore');
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
        console.log(newHeader);

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
            console.log('green data',greenAPIData);
            

            try {
                if (Object.keys(greenAPIData).length > 0) {
                    console.log('greenAPIData', greenAPIData);
                    const combinedObject = { ...selectedBox, ...greenAPIData };
                    console.log('combinedObject', combinedObject);
                    console.log('sending greenAPi data');
                    
                    await sendDataToPubSub(combinedObject);
                } else {
                    console.log('selectedBox', selectedBox);
                    console.log('sending normal data');
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
        <div className='convert_page_body'>
            <div className="convert_main_page">
                <Page fullWidth>
                    <div className='convert_page_main_container_section'>
                        <div className='convert_page_main_container_heading'>
                            <Text variant="heading3xl" as="h3">
                                Let’s Convert
                            </Text>
                        </div>
                        <div className='convert_page_main_container_sub_heading'>
                            <Text variant="headingLg" as="h5">
                                Choose the right message that suits your customers
                            </Text>
                        </div>
                    </div>
                    <div className="convert_page_card_container">
                        {cards.map(card => (
                            <>
                                <div
                                    key={card.id}
                                    className={`convert_page_card ${selectedCard === card.id ? 'convert_page_card_selected' : ''}`}
                                    onClick={() => handleSelectCard(card.id)}
                                >
                                    <Card>
                                        <div className='convert_page_card_div'>
                                            <textarea
                                                className="convert_page_card_header"
                                                value={card.header}
                                                onChange={(e) => handleHeaderChange(card.id, e.target.value)}
                                                placeholder="Card Header"
                                            />
                                            <textarea
                                                className="convert_page_card_body"
                                                value={card.body}
                                                onChange={(e) => handleBodyChange(card.id, e.target.value)}
                                                placeholder="Card Body"
                                            />
                                            <div className='convert_page_card_button'>
                                                <Button onClick={handleSaveAndSend} variant="primary">Save Text</Button>
                                            </div>
                                        </div>

                                    </Card>

                                </div>

                            </>
                        ))}

                    </div>
                    {isSuccessMessageVisible && <div style={{ margin: '5px 0', color: 'green' }}>Data saved and sent successfully</div>}
                </Page>
            </div>
        </div>
    )
}

export default ConvertPage;
