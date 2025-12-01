import React, { useState } from "react";

const ToggleSwitch = ({ onToggle, active, setActive, t }: any) => {

    const handleToggle = (option: any) => {
        setActive(option);
        if (onToggle) onToggle(option);
    };

    return (
        <div className="inline-flex border border-gray-300 rounded-full bg-gray-100 p-1">
            <button
                onClick={() => handleToggle("Monthly")}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${active === "Monthly"
                    ? "bg-neutral-800 text-white"
                    : "text-gray-600 hover:text-black"
                    }`}
            >
                {t("settings.monthly")}
            </button>
            <button
                onClick={() => handleToggle("Yearly")}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${active === "Yearly"
                    ? "bg-neutral-800 text-white"
                    : "text-gray-600 hover:text-black"
                    }`}
            >
                {t("settings.yearly")}
            </button>
        </div>
    );
};

export default ToggleSwitch;
