import { Pagination, Text } from '@shopify/polaris'
import React, { useEffect, useState } from 'react'

export default function WhatWeDoSection() {
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [current, setCurrent] = useState(0);
    const slides = [
        {
            id: 1,
            img: "/images/homePage/CartRecovery.webp",
            caption: "Boost sales by recovering carts through WhatsApp"
        },
        {
            id: 2,
            img: "/images/homePage/AIPersonalAssistant.webp",
            caption: "Turn browsing into buying with your AI shopping assistant"
        },
        {
            id: 3,
            img: "/images/homePage/RealRevenue.webp",   
            caption: "Boost conversions with personalized recommendations"
        }
    ];

    useEffect(() => {
        const loadImages = async () => {
            const promises = slides.map(slide =>
                new Promise((resolve) => {
                    const img = new Image();
                    img.src = slide.img;
                    img.onload = resolve;
                    img.onerror = resolve;
                })
            );
            await Promise.all(promises);
            setImagesLoaded(true);
        };

        loadImages();
    }, []);

    const prevSlide = () => {
        setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const nextSlide = () => {
        setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className='mt-10 mb-16 px-4 md:px-0'>
            <div className='text-center md:text-left'>
                <Text variant="headingLg" as="h5">
                    Here's What We Do
                </Text>
            </div>
            <div className='mb-2'></div>
            <div className='text-center md:text-left'>
                <Text variant="bodyLg" as="p" fontWeight='bold'>
                    {slides[current].caption}
                </Text>
            </div>
            <div className={`mt-8 ${imagesLoaded ? 'loaded' : 'not_loaded'}`}>
                <div className="flex justify-center">
                    {imagesLoaded ? (
                        <img
                            src={slides[current].img}
                            alt="Feature"
                            className=""
                        />
                    ) : (
                        <div className="image-placeholder h-48 md:h-64 flex items-center justify-center w-full">
                            <Text as="p" variant="bodyMd">
                                Loading images...
                            </Text>
                        </div>
                    )}
                </div>
            </div>
            <div className='mt-6 flex justify-center'>
                <Pagination
                    hasPrevious
                    onPrevious={prevSlide}
                    hasNext
                    onNext={nextSlide}
                />
            </div>
        </div>
    )
}