import React from 'react';
import { useNavigate } from '@remix-run/react';

let isBannerHidden = false;

export default function BlackFridaySaleBanner({ className, src, btnClass }: any) {
  const navigate = useNavigate();
  const [isImageVisible, setIsImageVisible] = React.useState(!isBannerHidden);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const handleBannerClick = () => {
    navigate("/app/Settings");
  };

  const hideImage = () => {
    isBannerHidden = true;
    setIsImageVisible(false);
  };

  return (
    <div>
      {isImageVisible && (
        <div className="relative inline-block">

          {isLoaded && (
            <button
              onClick={hideImage}
              className={btnClass}
              title="Close banner"
            >
              ×
            </button>
          )}

          <img
            onLoad={() => setIsLoaded(true)}
            onClick={handleBannerClick}
            className={className}
            src={src}
            alt="Banner"
          />
        </div>
      )}
    </div>
  );
}
