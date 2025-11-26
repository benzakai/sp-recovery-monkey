import { Pagination, Text, Button } from '@shopify/polaris'
import { XIcon } from '@shopify/polaris-icons';
import React, { useEffect, useState } from 'react'

export default function WhatWeDoSection() {
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [current, setCurrent] = useState(0);
    const [hidden, setHidden] = useState(false);

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
        const stored = localStorage.getItem("whatWeDoHidden");
        if (stored === "true") {
            setHidden(true);
        }
    }, []);

    const handleHide = () => {
        setHidden(true);
        localStorage.setItem("whatWeDoHidden", "true");
    };

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

    if (hidden) return null;

    return (
        <div className='mt-6 px-4 md:px-0'>
            <div className='mb-4 text-center md:text-left'>
                <p className="text-[13px] font-semibold">
                    Here's What We Do
                </p>
            </div>
            <div className='text-center md:text-left'>
                <p className="text-[13px]">
                    {slides[current].caption}
                </p>
            </div>

            <div className={`mt-4 ${imagesLoaded ? 'loaded' : 'not_loaded'}`}>
                <div className="flex justify-center">
                    {imagesLoaded ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <div style={{
                                position: 'absolute',
                                top: '-30px',
                                right: '0px',
                                zIndex: 10,
                            }}>
                                <Button
                                    variant="plain"
                                    onClick={handleHide}
                                    icon={XIcon}
                                    accessibilityLabel="Hide section"
                                />
                            </div>

                            <img
                                src={slides[current].img}
                                alt="Feature"
                                style={{ display: 'block', maxWidth: '100%' }}
                            />
                        </div>
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