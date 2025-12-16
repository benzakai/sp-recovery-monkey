import { Card, Button, ButtonGroup } from '@shopify/polaris'
import React, { useState } from 'react'

import MobileStore from '../SVGs/MobileStore'
import WhatsappScreenMobile from '../SVGs/WhatsappScreenMobile';
import DesktopStore from '../SVGs/DesktopStore';
import WhatsappScreen from '../SVGs/WhatsappScreen';

import { MobileIcon, DesktopIcon } from '@shopify/polaris-icons';
import Maximize from '../SVGs/Maximize';

import './ChatFeaturePreview.css';
import ChatDesktopMaximize from './ChatDesktopMaximize/ChatDesktopMaximize';

type IconStyleKey = 'style1' | 'style2' | 'style3' | 'style4' | 'style5';
type IconPositionKey = 'position1' | 'position2' | 'position3';

interface AiSettings {
    iconStyle?: IconStyleKey;
    iconPosition?: IconPositionKey;
}

interface ChatFeaturePreviewProps {
    aiSettings?: AiSettings;
}

const iconStyles: Record<IconStyleKey, string> = {
    style1: 'https://app.cartkeeper.co/images/chatWidget/icons/admin/chatIconStyle1.png',
    style2: 'https://app.cartkeeper.co/images/chatWidget/icons/admin/chatIconStyle2.png',
    style3: 'https://app.cartkeeper.co/images/chatWidget/icons/admin/chatIconStyle3.png',
    style4: 'https://app.cartkeeper.co/images/chatWidget/icons/admin/chatIconStyle4.png',
    style5: 'https://app.cartkeeper.co/images/chatWidget/icons/admin/chatIconStyle5.png',
};

const iconsClasses: Record<IconPositionKey, string> = {
    position1: 'ck-bottom-left',
    position2: 'ck-bottom-right',
    position3: 'ck-bottom-center',
};


export default function ChatFeaturePreview({ aiSettings }: ChatFeaturePreviewProps) {
    const [view, setView] = useState<'mobile' | 'desktop'>('mobile');
    const [showChat, setShowChat] = useState(false);

    const chatIcon = iconStyles[aiSettings?.iconStyle ?? 'style1'];
    const chatIconPosition = iconsClasses[aiSettings?.iconPosition ?? 'position2'];

    const openDesktopModal = () => {
        shopify.modal.show('chat_preview_desktop_modal');
    };

    return (
        <>
        <div className='media-card'>
                <div className="ck-preview-wrapper">

                    <div className="ck-preview-header">
                        <p className="ck-preview-title">Preview</p>

                        <ButtonGroup variant="segmented">
                            <Button pressed={view === 'mobile'} icon={MobileIcon} onClick={() => setView('mobile')} />
                            <Button pressed={view === 'desktop'} icon={DesktopIcon} onClick={() => setView('desktop')} />
                        </ButtonGroup>
                    </div>

                    <div className="ck-preview-container">

                        {view === 'mobile' ? (
                            <MobileStore />
                        ) : (
                            <div className="ck-desktop-wrapper">
                                <DesktopStore />

                                <div className="ck-maximize-btn" onClick={openDesktopModal}>
                                    <Maximize />
                                </div>
                            </div>
                        )}

                        {!showChat && (
                            <img
                                src={chatIcon}
                                className={`ck-chat-icon ${chatIconPosition} ${view}`}
                                onClick={() => setShowChat(true)}
                            />
                        )}

                        {showChat && (
                            <div className={`ck-chat-popup ${chatIconPosition}`}>
                                {view === 'mobile' ? <WhatsappScreenMobile /> : <WhatsappScreen />}

                                <div className="ck-chat-close-btn" onClick={() => setShowChat(false)}>✕</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        
            <ChatDesktopMaximize chatIcon={chatIcon} chatIconPosition={chatIconPosition} view={view} />

        </>
    );
}
