import React, { useState } from 'react'
import WhatsappScreen from '../../SVGs/WhatsappScreen'
import './ChatDesktopMaximize.css'
import DesktopStoreMax from '../../SVGs/DesktopStoreMax';
import WhatsappScreenMax from '../../SVGs/WhatsappScreenMax';

interface ChatDesktopMaximizeProps {
    chatIcon: string;
    chatIconPosition: string;
    view: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatDesktopMaximize({
    chatIcon,
    chatIconPosition,
    view,
    isOpen,
    onClose,
}: ChatDesktopMaximizeProps) {

    const [showChat, setShowChat] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="ck-custom-modal-overlay">
            <div className="ck-custom-modal">

                <DesktopStoreMax width='100%' height='100%' />
                <div className="ck-modal-hide" onClick={onClose}>
                    ✕
                </div>
                

                <img
                    src={chatIcon}
                    className={`ck-chat-icon ${chatIconPosition} ${view}`}
                    onClick={() => setShowChat(true)}
                />

               {showChat && (
                    <div className={`ck-chat-popup ${chatIconPosition} popup-new-modal`}>
                        <WhatsappScreen />
                        <div className="ck-chat-close-btn" onClick={() => setShowChat(false)}>✕</div>
                    </div>
                )}
            </div>
        </div>
    )
}
