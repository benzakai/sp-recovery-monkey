import * as React from 'react';
import '../AbandonedCarts.css'

export default function AbandonedCheckouts() {
    const [getData, setData] = React.useState([]);
    const [sortOrder, setSortOrder] = React.useState('ascending');
    const [sortBy, setSortBy] = React.useState('updated_at'); 
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;
    const [searchTerm, setSearchTerm] = React.useState('');
    let sum = 0;
    let recoveredSum = 0;
    const AllOverValue = () => {
        sum = getData.reduce((acc, value) => acc + parseFloat(value.total_price), 0);
    }; 

    const recoveredCheckoutsTotalPrice = ()=>{
        getData?.forEach((item) => {
            if(item.completed_at){
                recoveredSum += parseFloat(item.total_price);
            }
        })
    };

    const handleSort = (order) => {
        setSortOrder(order);
    };

    const handleSortBy = (criterion) => {
        setSortBy(criterion);
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };
    const filteredData = getData.filter(item => 
        item.customer && 
        (item.customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         item.customer.updated_at?.toLowerCase().includes(searchTerm.toLowerCase())  || 
         item.customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase())) 
    );

    const sortedData = [...filteredData].sort((a, b) => {
        const dateA = new Date(a[sortBy]);
        const dateB = new Date(b[sortBy]);
        return dateB - dateA;
    });

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

    React.useEffect(() => {
        handleFetchAbandonedCheckouts();
    }, []);
    AllOverValue();
    recoveredCheckoutsTotalPrice();
    console.log(getData);
    console.log(recoveredSum);
    

    return (
        <> 
            <div className="container">
                <div className="card">
                    <div className="header">
                        <div>Abandoned </div><div> Carts</div> 
                    </div>

                    <div className="row">
                        <div className="left-column">
                            <div className="data-block">
                                <div className="data-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" /></svg></div>
                                <div className="data-text">{getData?.length > 0 ? getData?.length : '0'}</div>
                            </div>
                            <div className="subtext">Abandoned Carts</div>
                            <br />
                            <div className="data-block">
                                <div className="data-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M326.7 403.7c-22.1 8-45.9 12.3-70.7 12.3s-48.7-4.4-70.7-12.3l-.8-.3c-30-11-56.8-28.7-78.6-51.4C70 314.6 48 263.9 48 208C48 93.1 141.1 0 256 0S464 93.1 464 208c0 55.9-22 106.6-57.9 144c-1 1-2 2.1-3 3.1c-21.4 21.4-47.4 38.1-76.3 48.6zM256 91.9c-11.1 0-20.1 9-20.1 20.1l0 6c-5.6 1.2-10.9 2.9-15.9 5.1c-15 6.8-27.9 19.4-31.1 37.7c-1.8 10.2-.8 20 3.4 29c4.2 8.8 10.7 15 17.3 19.5c11.6 7.9 26.9 12.5 38.6 16l2.2 .7c13.9 4.2 23.4 7.4 29.3 11.7c2.5 1.8 3.4 3.2 3.7 4c.3 .8 .9 2.6 .2 6.7c-.6 3.5-2.5 6.4-8 8.8c-6.1 2.6-16 3.9-28.8 1.9c-6-1-16.7-4.6-26.2-7.9c0 0 0 0 0 0s0 0 0 0s0 0 0 0c-2.2-.7-4.3-1.5-6.4-2.1c-10.5-3.5-21.8 2.2-25.3 12.7s2.2 21.8 12.7 25.3c1.2 .4 2.7 .9 4.4 1.5c7.9 2.7 20.3 6.9 29.8 9.1l0 6.4c0 11.1 9 20.1 20.1 20.1s20.1-9 20.1-20.1l0-5.5c5.3-1 10.5-2.5 15.4-4.6c15.7-6.7 28.4-19.7 31.6-38.7c1.8-10.4 1-20.3-3-29.4c-3.9-9-10.2-15.6-16.9-20.5c-12.2-8.8-28.3-13.7-40.4-17.4l-.8-.2c-14.2-4.3-23.8-7.3-29.9-11.4c-2.6-1.8-3.4-3-3.6-3.5c-.2-.3-.7-1.6-.1-5c.3-1.9 1.9-5.2 8.2-8.1c6.4-2.9 16.4-4.5 28.6-2.6c4.3 .7 17.9 3.3 21.7 4.3c10.7 2.8 21.6-3.5 24.5-14.2s-3.5-21.6-14.2-24.5c-4.4-1.2-14.4-3.2-21-4.4l0-6.3c0-11.1-9-20.1-20.1-20.1zM48 352l16 0c19.5 25.9 44 47.7 72.2 64L64 416l0 32 192 0 192 0 0-32-72.2 0c28.2-16.3 52.8-38.1 72.2-64l16 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48l0-64c0-26.5 21.5-48 48-48z"/></svg></div>
                                <div className="data-text">${sum.toFixed(2)}</div>
                            </div>
                            <div className="subtext">Unlockable Revenue</div>
                            <br />
                            <div className="data-block">
                                <div className="data-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96zM252 160c0 11 9 20 20 20l44 0 0 44c0 11 9 20 20 20s20-9 20-20l0-44 44 0c11 0 20-9 20-20s-9-20-20-20l-44 0 0-44c0-11-9-20-20-20s-20 9-20 20l0 44-44 0c-11 0-20 9-20 20z"/></svg></div>
                                <div className="data-text">${recoveredSum.toFixed(2)}</div>
                            </div>
                            <div className="subtext">Recovered Revenue</div>
                        </div>
                        
                        <div className="right-column">
                            {currentItems.length > 0 ? (
                                currentItems.map((item) => {
                                    return (
                                        <div className="item-row" key={item.id}>
                                            <div className="item-icon"><svg style={{ width: '17px', height: '17px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" /></svg></div>
                                            <div style={{width:'49%',marginRight:'5px'}}>{item.updated_at ? item.updated_at.split("T")[0] : 'N/A'}</div>
                                            <div style={{width:'45%',marginRight:'5px'}}>{item.customer.first_name || 'N/A'} {item.customer.last_name || 'N/A'}</div>
                                            <div style={{width:'43%',marginRight:'5px'}}>${item.total_price || 'N/A'}</div>
                                            <div style={{width:'15%',marginRight:'5px'}}>
                                                {item.completed_at ? (
                                                    <svg style={{ width: '17px', height: '17px',backgroundColor:'lightgreen' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" /></svg>
                                                ) : (
                                                    <svg style={{ width: '17px', height: '17px',backgroundColor:'yellow' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z"/></svg>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div>No abandoned checkouts found.</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
            
          
        </>
    )

    async function handleFetchAbandonedCheckouts() {
        try {
            const response = await fetch("/api/abandoned-checkouts/get");
            if (response.ok == true && response.status == 200) {
                const responseData = await response.json();

                setData(responseData.data);
            }
        } catch (error) {
            console.log("handleFetchAbandonedCheckouts Error", error);
        }
    }
}