export default function TwoSVG({ width = "35", height = "35" }) {
    return (
        <svg width={width} height={height} viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_774_37)">
                <circle cx="15.5" cy="11.5" r="11.5" fill="#698FE3" />
            </g>
            <path d="M12.0572 16V14.6676L15.592 11.2024C15.93 10.861 16.2118 10.5578 16.4371 10.2926C16.6625 10.0275 16.8316 9.7706 16.9442 9.52202C17.0569 9.27344 17.1133 9.00829 17.1133 8.72656C17.1133 8.40507 17.0404 8.12997 16.8945 7.90128C16.7487 7.66927 16.5482 7.49029 16.293 7.36435C16.0378 7.2384 15.7478 7.17543 15.4229 7.17543C15.0882 7.17543 14.7949 7.24503 14.543 7.38423C14.2911 7.52012 14.0955 7.71401 13.9563 7.96591C13.8204 8.2178 13.7525 8.51776 13.7525 8.86577H11.9975C11.9975 8.21946 12.145 7.65767 12.44 7.1804C12.735 6.70312 13.141 6.33357 13.658 6.07173C14.1784 5.8099 14.775 5.67898 15.4478 5.67898C16.1306 5.67898 16.7305 5.80658 17.2475 6.06179C17.7646 6.317 18.1656 6.66667 18.4506 7.1108C18.739 7.55492 18.8832 8.06203 18.8832 8.6321C18.8832 9.01326 18.8103 9.38778 18.6644 9.75568C18.5186 10.1236 18.2617 10.5312 17.8938 10.9787C17.5292 11.4261 17.0172 11.968 16.3576 12.6044L14.6026 14.3892V14.4588H19.0373V16H12.0572Z" fill="#F5FAFF" />
            <defs>
                <filter id="filter0_d_774_37" x="0" y="0" width={width} height={height} filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_774_37" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_774_37" result="shape" />
                </filter>
            </defs>
        </svg>
    )
}