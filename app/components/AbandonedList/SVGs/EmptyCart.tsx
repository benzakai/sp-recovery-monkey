
export default function EmptyCart({ width = "150", height = "150" }) {
    return (
        <svg width={width} height={height} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                    <feOffset dx="2" dy="4" result="offsetblur" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.2" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <circle cx="128" cy="128" r="110" fill="#eef0f2" />

            <rect x="90" y="60" width="45" height="45" rx="2" fill="#848b95" />
            <rect x="90" y="80" width="70" height="60" rx="2" fill="#9ea3ac" opacity="0.9" />
            <path d="M80 80 L180 80 L165 150 L95 150 Z" fill="#b0b5bd" opacity="0.5" />

            <path d="M40 50 L75 65 L100 160 Q100 180 120 180 L190 180"
                stroke="#136c4e"
                stroke-width="12"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none" />

            <circle cx="105" cy="210" r="12" fill="#114f3a" />
            <circle cx="175" cy="210" r="12" fill="#114f3a" />

            <g filter="url(#shadow)">
                <circle cx="195" cy="65" r="42" fill="#ea856f" />

                <path d="M180 50 L210 80 M210 50 L180 80"
                    stroke="white"
                    stroke-width="8"
                    stroke-linecap="round"
                    stroke-linejoin="round" />
            </g>
        </svg>
    )
}
