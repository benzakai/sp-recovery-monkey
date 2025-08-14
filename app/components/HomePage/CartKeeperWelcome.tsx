import {
    Card,
    Text,
    Button,
    BlockStack,
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import "./CartKeeperWelcome.css"; 
import { useNavigate } from "@remix-run/react";

export default function CartKeeperWelcome() {
    const slides = [
        {
            id: 1,
            img: "/images/homePage/CartRecovery.svg",
            caption: "Boost sales by recovering carts through WhatsApp"
        },
        {
            id: 2,
            img: "/images/homePage/AIPersonalAssistant.svg",
            caption: "Turn browsing into buying with your AI shopping assistant"
        },
        {
            id: 3,
            img: "/images/homePage/RealRevenue.svg",
            caption: "Boost conversions with personalized recommendations"
        }
    ];

    const [current, setCurrent] = useState(0);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const navigate = useNavigate()

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
        <div className="cartkeeper-container">
            <div className="cartkeeper-left">
                <div className="cartkeeper-header">
                    <Text variant="headingMd" as="h6">
                        Welcome To CartKeeper!
                    </Text>
                    <Text variant="headingXl" as="h2" fontWeight="bold">
                        Here's What We Do
                    </Text>
                </div>

                <div className="carousel-container">
                    <button onClick={prevSlide} className="carousel-btn left-btn">
                        <img src="/images/homePage/leftNav.png" alt="Previous" />
                    </button>

                    <div className="carousel-content">
                        <Text variant="bodyLg" as="p" fontWeight="medium">
                            {slides[current].caption}
                        </Text>
                        {imagesLoaded ? (
                            <img
                                src={slides[current].img}
                                alt="Feature"
                                className="carousel-image"
                            />
                        ) : (
                            <div className="image-placeholder">
                                <Text as="p" variant="bodyMd" alignment="center">
                                    Loading images...
                                </Text>
                            </div>
                        )}
                    </div>

                    <button onClick={nextSlide} className="carousel-btn right-btn">
                        <img src="/images/homePage/rightNav.png" alt="Next" />
                    </button>
                </div>

                <div className="carousel-dots">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`dot ${i === current ? "active" : ""}`}
                        />
                    ))}
                </div>
            </div>

            <div className="cartkeeper-right">
                <Card padding="600">
                    <div className="card-content">
                        <BlockStack inlineAlign="center" gap="400">
                            <div className="icon-wrapper">
                                <img
                                    src="/images/homePage/homeCarKeeperIcon.png"
                                    alt="CartKeeper"
                                    className="cartkeeper-icon"
                                />
                            </div>
                            <BlockStack gap="200">
                                <Text variant="bodyMd" as="p" tone="subdued" alignment="center">
                                    AI WhatsApp Cart Recovery
                                </Text>
                            </BlockStack>
                            <Button variant="primary" onClick={()=>navigate("/app/LetsStart")} size="large" fullWidth>
                                Get Started
                            </Button>
                        </BlockStack>
                    </div>
                </Card>
            </div>
        </div>
    );
}
