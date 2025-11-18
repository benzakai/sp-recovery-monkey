import { Text } from '@shopify/polaris';


const renderOption = (
  items: any,
  aiSettings: any,
  setAISettings: any,
  groupName: any,
  disabled: boolean
) =>
  items.map(({ id, src }: any) => {
    const isChecked =
      groupName === "chat-icon-position"
        ? aiSettings.iconPosition === id
        : aiSettings.iconStyle === id;

    return (
      <label
        key={id}
        className={`relative flex flex-col items-center ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
      >
        <img
          src={src}
          alt={id}
          className={`w-20 ${groupName === "chat-icon-position" ? "h-16 ml-5" : "h-20 ml-2"
            } rounded-md`}
        />

        <input
          type="radio"
          name={groupName}
          value={id}
          checked={isChecked}
          disabled={disabled}
          onChange={(e) => {
            if (disabled) return;
            const updatedSettings =
              groupName === "chat-icon-position"
                ? { iconPosition: e.target.value }
                : { iconStyle: e.target.value };

            const newSettings = { ...aiSettings, ...updatedSettings };
            setAISettings(newSettings);
          }}
          className="peer hidden"
          id={id}
        />

        <div
          className={`absolute ${groupName === "chat-icon-position" ? "bottom-0" : "bottom-2"
            } -left-4 w-5 h-5 border border-neutral-300 rounded-full bg-neutral-300`}
        >
          <div
            className={`w-3 h-3 bg-neutral-600 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 ${isChecked ? "opacity-100" : "opacity-0"
              }`}
          />
        </div>
      </label>
    );
  });



const ChatIconSettings = ({ setAISettings, aiSettings, disabled = false }: any) => {

  const iconStyles = [
    {
      id: 'style1',
      src: 'https://app.cartkeeper.co/images/chatWidget/icons/admin/chatIconStyle1.png',
    },
    {
      id: 'style2',
      src: 'https://app.cartkeeper.co/images/chatWidget/icons/admin/chatIconStyle2.png',
    },
    {
      id: 'style3',
      src: 'https://app.cartkeeper.co/images/chatWidget/icons/admin/chatIconStyle3.png',
    },
    {
      id: 'style4',
      src: 'https://app.cartkeeper.co/images/chatWidget/icons/admin/chatIconStyle4.png',
    },
    {
      id: 'style5',
      src: 'https://app.cartkeeper.co/images/chatWidget/icons/admin/chatIconStyle5.png',
    },
  ];

  const iconPositions = [
    {
      id: 'position1',
      src: 'https://app.cartkeeper.co/images/chatWidget/iconPositions/chatIconPosition1.png',
    },
    {
      id: 'position2',
      src: 'https://app.cartkeeper.co/images/chatWidget/iconPositions/chatIconPosition2.png',
    },
    {
      id: 'position3',
      src: 'https://app.cartkeeper.co/images/chatWidget/iconPositions/chatIconPosition3.png',
    },
  ];

  return (
    <>
      <p className="text-[13px]">
        Chat Icon Style
      </p>
      <div className="flex gap-6 items-center mb-6 mt-2 ml-5">
        {renderOption(iconStyles, aiSettings, setAISettings, 'chat-icon-style', disabled)}
      </div>

      <p className="text-[13px]">
        Chat Icon Position
      </p>
      <div className="flex gap-6 items-center mt-2 ml-5">
        {renderOption(iconPositions, aiSettings, setAISettings, 'chat-icon-position', disabled)}
      </div>
    </>
  );
};

export default ChatIconSettings;
