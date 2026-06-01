import React, { useEffect, useState } from 'react';
import Euploria from "../../LetsStartPage/SVGs/Euploria";
import GreenMuse from "../../LetsStartPage/SVGs/GreenMuse";
import Kraftathlet from "../../LetsStartPage/SVGs/Kraftathlet";
import "./Testimonials.css";
import Klkl from '../../LetsStartPage/SVGs/Klkl';
import { Button, Text } from '@shopify/polaris';
import { XIcon } from '@shopify/polaris-icons';

export default function Testimonials({ t }: any) {
    const [current, setCurrent] = useState(0);
    const [selectedTestimonial, setSelectedTestimonial] = useState<any>(null);
    const [hidden, setHidden] = useState(false);

    const testimonials = [
        {
            id: 1,
            content: t("homePrePayment.testimonials.content1"),
            fullContent: t("homePrePayment.testimonials.fullContent1"),
            company: "Euploria",
            component: <Euploria />
        },
        {
            id: 2,
            content: t("homePrePayment.testimonials.content2"),
            fullContent: t("homePrePayment.testimonials.fullContent2"),
            company: "The Green Muse CBD",
            component: <GreenMuse />
        },
        {
            id: 3,
            content: t("homePrePayment.testimonials.content3"),
            fullContent: t("homePrePayment.testimonials.fullContent3"),
            company: "Kraftathlet",
            component: <Kraftathlet />
        },
        // {
        //     id: 4,
        //     content: "“Since we started using CartKeeper, our sales have grown by over 40%! The customer service is outstand...",
        //     fullContent: "“Since we started using CartKeeper, our sales have grown by over 40%! The customer service is outstanding - always helpful, quick to respond, and genuinely cares about our success.“",
        //     company: "klkl",
        //     component: <Klkl />
        // }
    ];

    useEffect(() => {
        const stored = localStorage.getItem("testimonials-cartkeeper");
        if (stored === "true") {
            setHidden(true);
        }
    }, []);

    const prevSlide = () => {
        setCurrent((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    const nextSlide = () => {
        setCurrent((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    };

    const getTestimonialPosition = (index: number) => {
        const total = testimonials.length;
        const position = (index - current + total) % total;

        if (position === 0) return 'center';
        if (position === 1) return 'right';
        if (position === total - 1) return 'left';
        return 'hidden';
    };

    const handleHide = () => {
        setHidden(true);
        localStorage.setItem("testimonials-cartkeeper", "true");
    };

    if (hidden) return null;

    return (
        <div className="mt-8 sm:mt-10 md:mt-16 flex justify-center">
            <div className="w-full md:px-6 relative">

                <div className="relative flex justify-center mb-8">
                    <Text variant="headingLg" as="h5">
                        {t("homePrePayment.testimonials.title")}
                    </Text>

                    <div className="absolute right-0">
                        <Button
                            variant="plain"
                            onClick={handleHide}
                            icon={XIcon}
                            accessibilityLabel="Hide section"
                        />
                    </div>
                </div>

                <button onClick={prevSlide} className="ts-carousel-btn ts-section-left">
                    <img src="/images/homePage/leftNav.png" alt="Previous" />
                </button>
                <button onClick={nextSlide} className="ts-carousel-btn ts-section-right">
                    <img src="/images/homePage/rightNav.png" alt="Next" />
                </button>

                <div className="ts-carousel-container">
                    <div className="ts-carousel-content">
                        <div className="ts-testimonials-grid">
                            {testimonials.map((testimonial, index) => {
                                const position = getTestimonialPosition(index);
                                const isCenter = position === 'center';

                                return (
                                    <div
                                        key={testimonial.id}
                                        className={`ts-testimonial-card ${position} ${isCenter ? 'ts-center-card' : 'ts-side-card'
                                            }`}
                                        onClick={() => setSelectedTestimonial(testimonial)}
                                    >
                                        <div className="bg-white rounded-lg shadow py-8 px-3 text-center h-full transition-all duration-300 cursor-pointer">
                                            <div className="flex justify-center mb-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <img
                                                        key={i}
                                                        src="/images/letsStartPage/star.png"
                                                        alt="Star"
                                                        className="h-5 mx-0.5"
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-gray-700 mb-4">
                                                {testimonial.content}
                                            </p>
                                            <div className="flex justify-center items-center gap-2">
                                                {React.cloneElement(testimonial.component, {
                                                    className: "ts-svg mt-1",
                                                })}
                                                <span className="text-sm text-gray-600">{testimonial.company}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="ts-carousel-dots">
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`ts-dot ${i === current ? "ts-active" : ""}`}
                        />
                    ))}
                </div>
            </div>

            {
                selectedTestimonial && (
                    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8 relative">
                            <button
                                onClick={() => setSelectedTestimonial(null)}
                                className="absolute top-4 left-4 text-gray-600 text-2xl font-bold"
                            >
                                ×
                            </button>
                            <div className="flex justify-center mb-4 mt-2">
                                {[...Array(5)].map((_, i) => (
                                    <img
                                        key={i}
                                        src="/images/letsStartPage/star.png"
                                        alt="Star"
                                        className="h-6 mx-0.5"
                                    />
                                ))}
                            </div>
                            <p className="text-gray-700 mb-6 text-center">
                                {selectedTestimonial.fullContent}
                            </p>
                            <div className="flex justify-center items-center gap-2">
                                {React.cloneElement(selectedTestimonial.component, {
                                    className: "ts-svg mt-1",
                                })}
                                <span className="font-medium text-gray-700">{selectedTestimonial.company}</span>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
