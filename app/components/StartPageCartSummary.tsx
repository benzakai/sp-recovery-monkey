
import { StartPageCartSummaryProps } from "~/routes/app._index";

export default function StartPageCartSummary({ getCards }: StartPageCartSummaryProps) {

    return (
        <div className='bg-white rounded-xl shadow-sm border border-solid border-[#B5B5B5] p-6'>
            <div className='flex justify-around items-center'>
                {
                    getCards?.map((card) => {
                        return (
                            <div key={card.id} className='flex flex-col w-1/4 justify-center items-center text-center'>
                                <div className='cursor-pointer' onClick={card?.handleNavigate}>{card.icon}</div>
                                {card?.value ? <>
                                    {card.value === "Loading" ? (
                                        <div className="animate-pulse space-y-2 my-3">
                                            <div className="bg-gray-300 rounded h-5 w-24"></div>
                                        </div>
                                    ) : (
                                        <div className='font-bold text-2xl pt-4 pb-3'>{card.value}</div>
                                    )}
                                </> : <div className='font-bold text-2xl pt-4'>{card.value}</div>}
                                <div className='font-semibold text-2xl pb-1'>{card.title}</div>
                                <div className='text-base text-[#6B7177] w-[75%]'>{card.description}</div>
                            </div>
                        );
                    })
                }
            </div>
        </div>

    )
}