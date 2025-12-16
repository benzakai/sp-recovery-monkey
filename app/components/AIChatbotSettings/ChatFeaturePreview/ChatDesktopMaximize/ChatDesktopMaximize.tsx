import { Modal } from '@shopify/app-bridge-react'
import React, { useState } from 'react'
import DesktopStore from '../../SVGs/DesktopStore'
import WhatsappScreen from '../../SVGs/WhatsappScreen';
import './ChatDesktopMaximize.css'

interface ChatDesktopMaximizeProps {
    chatIcon: string;
    chatIconPosition: string;
    view: string;
}

export default function ChatDesktopMaximize({ chatIcon, chatIconPosition, view }: ChatDesktopMaximizeProps) {
    const [showChat, setShowChat] = useState(false);

    return (
        <Modal id="chat_preview_desktop_modal">
            <div className="ck-modal-content popup-modal">

                <DesktopStore width='100%' height='100%' />

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
        </Modal>
    )
}
