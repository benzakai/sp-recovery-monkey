
import { StartPageCartSummaryProps } from "~/routes/app._index";

export default function StartPageCartSummary({ getCards }: StartPageCartSummaryProps) {

    return (
        <div className='icon-block welcomeSummary_parent bg-white rounded-xl shadow-sm border border-solid border-[#B5B5B5]'>
            <div className='flex flex-row justify-around items-start pt-6 pb-8 font-inter'>
                {
                    getCards?.map((card) => {
                        return (
                            <div key={card.id} className='flex flex-col justify-center items-center text-center w-1/4'>
                                <div className='cursor-pointer' onClick={card?.handleNavigate}>{card.icon}</div>
                                {card?.value ? <>
                                    {card.value === "Loading" ? (
                                        <div className="animate-pulse space-y-2 pt-4 pb-3">
                                            <div className="bg-gray-300 rounded h-8 w-28"></div>
                                        </div>
                                    ) : (
                                        <div className='font-bold text-2xl pt-4 pb-3'>{card.value}</div>
                                    )}
                                </> : <div className='font-bold text-2xl pt-4'>{card.value}</div>}
                                <div className='font-semibold text-2xl pb-1 icon-title'>{card.title}</div>
                                <div className='text-[13px] text-[#6B7177] w-[85%] icon-subtitle'>{card.description}</div>
                            </div>
                        );
                    })
                }
            </div>
        </div>

    )
}