import { Banner } from '@shopify/polaris'
import React, { useEffect, useState } from 'react'

export default function BannerInfo() {
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("ck-bannerInfo");
        if (stored === "true") {
            setHidden(true);
        }
    }, []);

    const handleHide = () => {
        setHidden(true);
        localStorage.setItem("ck-bannerInfo", "true");
    };

    if (hidden) return null;

    return (
        <div className='mb-6'>
            <Banner title="Abandoned cart messages are now sending automatically" onDismiss={handleHide}>
                <p>Complete the rest of the app setup</p>
            </Banner>
        </div>
    )
}
