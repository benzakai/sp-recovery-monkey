import React, { useState } from 'react';
import Euploria from "./SVGs/Euploria";
import GreenMuse from "./SVGs/GreenMuse";
import Kraftathlet from "./SVGs/Kraftathlet";
import "./letsStartPage.css";
import Klkl from './SVGs/Klkl';

export default function Testimonials() {
    const [current, setCurrent] = useState(0);
    const [selectedTestimonial, setSelectedTestimonial] = useState<any>(null);

    const testimonials = [
        {
            id: 1,
            content: "“Great app, basically plug and play and worked from day 1, devs are quick to respond to questions, highly recommend!”",
            fullContent: "“Great app, basically plug and play and worked from day 1, devs are quick to respond to questions, highly recommend!”",
            company: "Euploria",
            component: <Euploria />
        },
        {
            id: 2,
            content: "“There is no way to fully describe how much I do recommend to anyone to use this app. Efficient, fast, targeting th...",
            fullContent: "“There is no way to fully describe how much I do recommend to anyone to use this app. Efficient, fast, targeting the intention of buying. App allows you to have a custom message so you can add special code and info over the order. Messages are sent directly into WhatsApp chat without any kind of interaction besides than the scope of the app: generate a sell. The team is always supporting for help directly in WhatsApp (ofc!) which makes it fast and easy. I repeat one point which I think makes Cartkeeper special: it trigger the intention of buying, not the abandoned cart. Super recommended!”",
            company: "The Green Muse CBD",
            component: <GreenMuse />
        },
        {
            id: 3,
            content: "“I started using Cartkeeper, had a few issues and the support team ALWAYS responded extremely fast and sol...",
            fullContent: "“I started using CartKeeper, had a few issues and the support team ALWAYS responded extremely fast and solved my queries fast and efficiently! If I would to choose between any other app out there I would choose CartKeeper. Amazing team and amazing value this app brings. Weiter so!”",
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

    return (
        <div className="mt-20 flex justify-center">
            <div className="w-full md:px-6 relative">
                <h2 className="text-center text-xl font-semibold mb-8">
                    Discover Why Merchants Choose CartKeeper
                </h2>

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

            {selectedTestimonial && (
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
            )}
        </div>
    );
}
