import { Card, Link, Text } from '@shopify/polaris'
import './GettingStartedSection.css'
import Dashboard from './SVG/Dashboard'
import CustomerList from './SVG/CustomerList'
import BulkCampaign from './SVG/BulkCampaign'
import AIChatbot from './SVG/AIChatbot'
import Calendar from './SVG/Calendar'
import Youtube from './SVG/Youtube'
import Chat from './SVG/Chat'
import { useNavigate } from '@remix-run/react'

export default function GettingStartedSection({ t }: any) {

    const navigate = useNavigate();

    const startCartkeeperValues = [
        {
            id: "dashboard",
            icon: <Dashboard />,
            title: t("homePrePayment.gettingStarted.dashboard"),
            description: t("homePrePayment.gettingStarted.dashboardDescription"),
            redirectTo: '/app/WelcomeConnect'
        },
        {
            id: "customerList",
            icon: <CustomerList />,
            title: t("homePrePayment.gettingStarted.customerList"),
            description: t("homePrePayment.gettingStarted.customerListDescription"),
            redirectTo: '/app/AbandonedList'
        },
        {
            id: "bulkCampaign",
            icon: <BulkCampaign />,
            title: t("homePrePayment.gettingStarted.bulkCampaign"),
            description: t("homePrePayment.gettingStarted.bulkCampaignDescription"),
            redirectTo: '/app/SmartBulk'
        },
        {
            id: "aiChatbot",
            icon: <AIChatbot />,
            title: t("homePrePayment.gettingStarted.aiChatbot"),
            description: t("homePrePayment.gettingStarted.aiChatbotDescription"),
            redirectTo: '/app/AIChatbot'
        }
    ]

    const weAreHereForYouValues = [
        {
            id: "chat",
            icon: <Chat />,
            title: t("homePrePayment.gettingStarted.whatsappChat"),
            description: t("homePrePayment.gettingStarted.whatsappChatDescription"),
            linkText: t("homePrePayment.gettingStarted.whatsappLinkText"),
            link: "https://api.whatsapp.com/send/?phone=972555081948&text=Hi%0AI+have+a+quick+question+about+the+app&type=phone_number&app_absent=0"
        },
        {

            id: "calendar",
            icon: <Calendar />,
            title: t("homePrePayment.gettingStarted.bookADemo"),
            description: t("homePrePayment.gettingStarted.bookADemoDescription"),
            linkText: t("homePrePayment.gettingStarted.bookADemoLinkText"),
            link: "https://calendly.com/menachem-cartkeeper/30min?_kx=DhrmYr-6_f_hMfCG6iSw83YN_fWNYGyEpn5MNzkfmZg.WSxRdN"
        },
        {
            id: "youtube",
            icon: <Youtube />,
            title: t("homePrePayment.gettingStarted.videoTutorial"),
            description: t("homePrePayment.gettingStarted.videoTutorialDescription"),
            linkText: t("homePrePayment.gettingStarted.videoTutorialLinkText"),
            link: "https://www.youtube.com/shorts/f3Z_M0B8Nqo"
        },
    ]

    const openLink = (url: string) => window.open(url, '_blank');

    return (
        <div className='mt-8 sm:mt-10 md:mt-16'>
            <Text variant="headingLg" as="h5">
                {t("homePrePayment.gettingStarted.title")}
            </Text>
            <div className='mb-4'></div>
            <Card padding='400'>
                <p className="text-[13px] font-semibold">
                    {t("homePrePayment.gettingStarted.subTitle")}
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4 w-full cartKeeper'>
                    {
                        startCartkeeperValues.map((card) => {
                            return (
                                <div key={card.id} className='w-full min-w-0 cursor-pointer' onClick={() => navigate(card.redirectTo)}>
                                    <Card>
                                        <div className='flex flex-col justify-start gap-3 min-w-0'>
                                            <div className='getting-started-icon'>
                                                {card.icon}
                                            </div>
                                            <p className="text-[13px] font-semibold">
                                                {card.title}
                                            </p>
                                            <p className="text-[13px] card-description">
                                                {card.description}
                                            </p>
                                        </div>
                                    </Card>
                                </div>
                            )
                        })
                    }
                </div>
            </Card>

            <div className='mb-4'></div>

            <Card padding='400'>
                <p className="text-[13px] font-semibold">
                    {t("homePrePayment.gettingStarted.weAreHereForYou")}
                </p>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 w-full social-card'>
                    {weAreHereForYouValues.map((card) => {
                        return (
                            <div className='w-full min-w-0'>
                                <div className='flex flex-col justify-start gap-3 bg-zinc-100 p-3 rounded-lg social-blk'>
                                    <div className='flex flex-row justify-start gap-3'>
                                        <p className="">
                                            {card.icon}
                                        </p>
                                        <p className="text-[13px] font-semibold">
                                            {card.title}
                                        </p>
                                    </div>
                                    <p className="text-[13px] text-wrap">
                                        {card.description}
                                    </p>
                                    <p className="text-[13px]">
                                        <Link onClick={() => openLink(card.link)} removeUnderline>{card.linkText}</Link>
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>
        </div >
    )
}
