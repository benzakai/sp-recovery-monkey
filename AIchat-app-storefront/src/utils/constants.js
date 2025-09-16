export const iconsClasses = {
  'position1': 'bottom-left',
  'position2': 'bottom-right',
  'position3': 'bottom-center'
};

export const iconsUrl = {
  'style1': 'https://app.cartkeeper.co/images/chatWidget/icons/extension/chatIconStyle1.png',
  'style2': 'https://app.cartkeeper.co/images/chatWidget/icons/extension/chatIconStyle2.png',
  'style3': 'https://app.cartkeeper.co/images/chatWidget/icons/extension/chatIconStyle3.png',
  'style4': 'https://app.cartkeeper.co/images/chatWidget/icons/extension/chatIconStyle4.png',
  'style5': 'https://app.cartkeeper.co/images/chatWidget/icons/extension/chatIconStyle5.png',
};

export const getBubblePosition = (position) => {
  switch (position) {
    case 'position1':
      return { left: '20px' };
    case 'position2':
      return { right: '20px' };
    default:
      return { left: '50%', transform: 'translateX(-50%)' };
  }
};