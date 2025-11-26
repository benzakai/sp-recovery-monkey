import { Card, Link, Text } from '@shopify/polaris'
import './GettingStartedSection.css'
import Dashboard from './SVG/Dashboard'
import CustomerList from './SVG/CustomerList'
import BulkCampaign from './SVG/BulkCampaign'
import AIChatbot from './SVG/AIChatbot'
import Calendar from './SVG/Calendar'
import Youtube from './SVG/Youtube'
import Chat from './SVG/Chat'

export default function GettingStartedSection() {

    const startCartkeeperValues = [
        {
            id: "dashboard",
            icon: <Dashboard />,
            title: "Dashboard",
            description: "Track your recovered carts and revenue"
        },
        {
            id: "customerList",
            icon: <CustomerList />,
            title: "Customer List",
            description: "View your CartKeeper purchases"
        },
        {
            id: "bulkCampaign",
            icon: <BulkCampaign />,
            title: "Bulk Campaign",
            description: "Message all your store customers"
        },
        {
            id: "aiChatbot",
            icon: <AIChatbot />,
            title: "AI Chatbot",
            description: "Engage customers and boost sales"
        }
    ]

    const weAreHereForYouValues = [
        {
            id: "chat",
            icon: <Chat />,
            title: "WhatsApp Chat",
            description: "Talk to us directly via WhatsApp chat to get help with your question.",
            linkText: "Message us on WhatsApp",
            link: "https://api.whatsapp.com/send/?phone=972555081948&text=Hi%0AI+have+a+quick+question+about+the+app&type=phone_number&app_absent=0"
        },
        {

            id: "calendar",
            icon: <Calendar />,
            title: "Book a Demo",
            description: "Book a free demo with our support team for setup assistance.",
            linkText: "Book a demo",
            link: "https://calendly.com/menachem-cartkeeper/30min?_kx=DhrmYr-6_f_hMfCG6iSw83YN_fWNYGyEpn5MNzkfmZg.WSxRdN"
        },
        {
            id: "youtube",
            icon: <Youtube />,
            title: "Video Tutorial",
            description: "Watch video tutorial for connecting CartKeeper to WhatsApp.",
            linkText: "Watch tutorial",
            link: "https://www.youtube.com/shorts/f3Z_M0B8Nqo"
        },
    ]

    const openLink = (url: string) => window.open(url, '_blank');

    return (
        <div className='mt-8 sm:mt-10 md:mt-16'>
            <Text variant="headingLg" as="h5">
                {"Let's recover some carts"}
            </Text>
            <div className='mb-4'></div>
            <Card padding='400'>
                <p className="text-[13px] font-semibold">
                    {"How to start with CartKeeper?"}
                </p>
                <div className='flex flex-row gap-3 mt-4 w-full cartKeeper'>
                    {
                        startCartkeeperValues.map((card) => {
                            return (
                                <div key={card.id} className='w-1/4'>
                                    <Card>
                                        <div className='flex flex-col justify-start gap-3'>
                                            {card.icon}
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
                    {"We're Here For You"}
                </p>

                <div className='flex flex-row  gap-6 mt-4 w-full social-card'>
                    {weAreHereForYouValues.map((card) => {
                        return (
                            <div className='w-1/3'>
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
