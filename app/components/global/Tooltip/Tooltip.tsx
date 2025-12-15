import { useState } from 'react';
import {
    InfoIcon
} from '@shopify/polaris-icons';
import './Tooltip.css'
import { Icon } from '@shopify/polaris';

export default function Tooltip({ children, className, minWidth = "350px" }: any) {
    const [tooltipVisible, setTooltipVisible] = useState(false);

    return (
        <div
            className={`relative inline-flex align-middle ${className || ''}`}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            onFocus={() => setTooltipVisible(true)}
            onBlur={() => setTooltipVisible(false)}
            tabIndex={0}
            aria-describedby="whatsapp-tooltip"
        >
            <div role="button" aria-label="Info">
                <Icon source={InfoIcon} />
            </div>

            {tooltipVisible && (
                <div id="whatsapp-tooltip" role="tooltip" className="whatsapp-tooltip" style={{ minWidth }}>
                    <div className="whatsapp-tooltip-content">
                        {children}
                    </div>
                    <div className="whatsapp-tooltip-arrow" />
                </div>)}
        </div>

    )
}
