export default function OneSVG({ width = "35", height = "35" }) {
    return (
        <svg width={width} height={height} viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_774_36)">
                <circle cx="15.5" cy="11.5" r="11.5" fill="#698FE3" />
            </g>
            <path d="M17.1829 6.81818V17H15.3384V8.61293H15.2788L12.8974 10.1342V8.44389L15.4279 6.81818H17.1829Z" fill="#F5FAFF" />
            <defs>
                <filter id="filter0_d_774_36" x="0" y="0" width={width} height={height} filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_774_36" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_774_36" result="shape" />
                </filter>
            </defs>
        </svg>

    )
}