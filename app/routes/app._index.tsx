import { Spinner, Card, Button, Text, Page, Badge, Layout } from '@shopify/polaris';
import { useNavigate, redirect, useActionData, useSubmit, useOutletContext } from '@remix-run/react';
import '../StartPage.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import StartPageCartSummary from '~/components/StartPageCartSummary';
import { authenticate, MONTHLY_PLAN } from '~/shopify.server';
import fireStoreCreateService from '~/services/fireStoreCreateService';
import DashboardSVG from '~/components/SVGs/DashboardSVG';
import CustomerListSVG from '~/components/SVGs/CustomerListSVG';
import Dashboard2SVG from '~/components/SVGs/Dashboard2SVG';

export interface Card {
  id: number;
  icon: JSX.Element;
  value: any;
  title: string;
  description: string;
  handleNavigate: () => void;
}

export interface StartPageCartSummaryProps {
  getCards: Card[];
}

export const action = async ({ request }: any) => {
  const { session } = await authenticate.admin(request)
  const formData = await request.formData();
  const planName = formData.get("planName") || MONTHLY_PLAN;
  // console.log("planName", planName);
  if (planName === "Free") {
    await fireStoreCreateService("subscriptions", session.shop, {
      storeId: session.shop,
      plan: "Free",
      status: "ACTIVE",
      startDate: new Date().toISOString(),
      endDate: ""
    }, {});
  } else {
    const { billing } = await authenticate.admin(request);
    const okay = await billing.require({
      plans: [planName],
      isTest: false,
      onFailure: async () => billing.request({
        plan: planName,
        isTest: false
      }),
    });
  }
  return { success: true };
};

export default function Index() {
  const navigate = useNavigate()
  const [planName, setPlanName] = useState('not set');
  const [isLoadingPlanButton, setLoadingPlanButton] = useState(false)
  const submit = useSubmit();
  const actionData = useActionData()
  const { anySubscription, setAnySubscription }: any = useOutletContext()
  const anySubscriptionRef = useRef(anySubscription);
  const [getCards, setCards] = useState([
    {
      id: 1,
      icon: <DashboardSVG />,
      value: null,
      title: "Dashboard",
      description: "Track your recovered carts and revenue",
      handleNavigate: () => handleIconsNavigate(anySubscriptionRef.current ? "/app/WelcomeConnect" : null)
    },
    {
      id: 2,
      icon: <CustomerListSVG />,
      value: null,
      title: "Customer List",
      description: "View your CartKeeper purchases",
      handleNavigate: () => handleIconsNavigate(anySubscriptionRef.current ? "/app/AbandonedList" : null)
    },
    {
      id: 3,
      icon: <Dashboard2SVG />,
      value: null,
      title: "Bulk Campaign",
      description: "Message all your store customers",
      handleNavigate: () => handleIconsNavigate(anySubscriptionRef.current ? "/app/SmartBulk" : null)
    }
  ]);

  const handleIconsNavigate = (data: any) => {
    console.log("data on handleIconsNavigate ", data, anySubscriptionRef.current);
    if (anySubscriptionRef.current !== "loading") {
      data ? navigate(data) : shopify.toast.show("Please select a plan to access this page.");
    } else {
      shopify.toast.show('Loading subscription details. Please wait.');
    }
  }


  useEffect(() => {
    if (actionData?.success) {
      if (planName === "Free") {
        setAnySubscription(true)
        shopify.toast.show("Your subscription is successfully created!")
      }
    }
  }, [actionData])

  useEffect(() => {
    anySubscriptionRef.current = anySubscription;
  }, [anySubscription]);

  const handleRedirectToMail = () => {
    try {
      const mailtoLink = `mailto:david@cartkeeper.co`;
      const newWindow = window.open(mailtoLink, '_blank');
      if (!newWindow) {
        throw new Error('Failed to open mail client. The popup might be blocked.');
      }
      console.log("newWindow", newWindow);
    } catch (error) {
      console.error("Error on opening a mail:", error);
    }
  };

  const handleRedirectToWhatsapp = () => {
    window.open("https://wa.me/+972555081948", "_blank");
  }


  const handlePlanSelect = (planName: any) => {
    if (planName === "Free") setLoadingPlanButton(true)
    setPlanName(planName);
    const formData = new FormData();
    formData.append("planName", planName);
    submit(formData, { method: "post" });
  };

  return (
    <div className="body">
      <div className='start_page'>
        <Page fullWidth>
          <div className='start_main_container' style={{ padding: "4rem 12rem 10rem 6rem" }}>
            <div className='start_main_container_heading pb-8'>
              <Text variant="heading3xl" as="h3" >
                Welcome
              </Text>
            </div>

            <div>
              <p className='font-bold text-2xl pb-6'>How to start with CartKeeper?</p>
              <StartPageCartSummary getCards={getCards} />
            </div>

            <div className="start_price_container">
              <div className="start_price_container_heading">
                <Text variant="headingLg" as="h5">
                  We're Here For You
                </Text>
              </div>

              <Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
                  <div className=" p-6 shadow-lg rounded-2xl border border-gray-200 relative h-48" style={{ backgroundColor: "#f8faff" }}>
                    <div className='flex flex-row items-center'>
                      <svg className='mr-4' width="24" height="21" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.85714 18.4788V14.6302C5.6585 14.4317 4.57038 13.8235 3.78583 12.9135C3.00129 12.0035 2.57104 10.8507 2.57143 9.6594V7.55953C2.57143 6.22292 3.11326 4.94106 4.07774 3.99593C5.04221 3.05081 6.35032 2.51984 7.71429 2.51984H16.2857C17.6497 2.51984 18.9578 3.05081 19.9223 3.99593C20.8867 4.94106 21.4286 6.22292 21.4286 7.55953V9.6594C21.4286 10.996 20.8867 12.2779 19.9223 13.223C18.9578 14.1681 17.6497 14.6991 16.2857 14.6991H12.0669L6.85714 18.4788ZM12.9154 17.2189H16.2857C17.2988 17.2189 18.3019 17.0234 19.2378 16.6435C20.1738 16.2636 21.0242 15.7068 21.7405 15.0048C22.4569 14.3028 23.0251 13.4695 23.4128 12.5523C23.8005 11.6351 24 10.6521 24 9.6594V7.55953C24 5.55462 23.1872 3.63182 21.7405 2.21413C20.2938 0.796448 18.3317 0 16.2857 0H7.71429C5.66833 0 3.70617 0.796448 2.25946 2.21413C0.812753 3.63182 8.49847e-07 5.55462 8.49847e-07 7.55953V9.6594C-0.000673709 11.0676 0.400234 12.448 1.1575 13.6448C1.91476 14.8416 2.99824 15.8072 4.28571 16.4327V18.4788C4.28547 18.9457 4.41756 19.4034 4.66726 19.801C4.91697 20.1985 5.27446 20.5203 5.69988 20.7304C6.12529 20.9405 6.60191 21.0306 7.07656 20.9908C7.55121 20.951 8.00523 20.7827 8.388 20.5048L12.9137 17.2189H12.9154ZM5.14286 6.29961C5.14286 5.96545 5.27832 5.64499 5.51943 5.40871C5.76055 5.17243 6.08758 5.03968 6.42857 5.03968H15.8571C16.1981 5.03968 16.5252 5.17243 16.7663 5.40871C17.0074 5.64499 17.1429 5.96545 17.1429 6.29961C17.1429 6.63376 17.0074 6.95422 16.7663 7.1905C16.5252 7.42678 16.1981 7.55953 15.8571 7.55953H6.42857C6.08758 7.55953 5.76055 7.42678 5.51943 7.1905C5.27832 6.95422 5.14286 6.63376 5.14286 6.29961ZM6.42857 9.6594C6.08758 9.6594 5.76055 9.79214 5.51943 10.0284C5.27832 10.2647 5.14286 10.5852 5.14286 10.9193C5.14286 11.2535 5.27832 11.5739 5.51943 11.8102C5.76055 12.0465 6.08758 12.1792 6.42857 12.1792H12.4286C12.7696 12.1792 13.0966 12.0465 13.3377 11.8102C13.5788 11.5739 13.7143 11.2535 13.7143 10.9193C13.7143 10.5852 13.5788 10.2647 13.3377 10.0284C13.0966 9.79214 12.7696 9.6594 12.4286 9.6594H6.42857Z" fill="black" />
                      </svg>
                      <h2 className="text-lg font-semibold text-gray-800">whatsapp chat</h2>
                    </div>
                    <div className='mb-4 mt-4'>
                      <p className="text-gray-600 text-base">Talk to us directly via WhatsApp chat to get help with your question.</p>
                    </div>
                    <div className=''>
                      <Button fullWidth size='large' variant='primary' onClick={handleRedirectToWhatsapp}>
                        Message us on WhatsApp
                      </Button>
                    </div>
                  </div>

                  <div className=" p-6 shadow-lg rounded-2xl border border-gray-200 relative h-48" style={{ backgroundColor: "#f8faff" }}>
                    <div className='flex flex-row items-center'>
                      <svg className='mr-4' width="24" height="21" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M4.71429 0C2.11029 0 0 2.35009 0 5.25V15.75C0 18.6499 2.11029 21 4.71429 21H19.2857C21.8897 21 24 18.6499 24 15.75V5.25C24 2.35009 21.8897 0 19.2857 0H4.71429ZM2.57143 5.25C2.57143 3.93273 3.53143 2.86364 4.71429 2.86364H19.2857C20.4686 2.86364 21.4286 3.93273 21.4286 5.25V15.75C21.4286 17.0673 20.4686 18.1364 19.2857 18.1364H4.71429C3.53143 18.1364 2.57143 17.0673 2.57143 15.75V5.25ZM6.11486 5.86091C5.472 5.52682 4.70743 5.83609 4.40571 6.55391C4.10571 7.26982 4.38343 8.12127 5.028 8.45727L11.0931 11.6092C11.6674 11.907 12.3326 11.907 12.9069 11.6092L18.972 8.45727C19.6166 8.12127 19.8943 7.26982 19.5943 6.55391C19.2943 5.83609 18.528 5.52682 17.8851 5.86091L12 8.91927L6.11486 5.86091Z" fill="black" />
                      </svg>
                      <h2 className="text-lg font-semibold text-gray-800">contact via email</h2>
                    </div>
                    <div className='mb-4 mt-4'>
                      <p className="text-gray-600 text-base">Contact us directly via email for help or support.</p>
                    </div>
                    <div className='mt-10'>
                      <Button fullWidth size='large' variant='primary' onClick={handleRedirectToMail}>
                        Send us an Email
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {anySubscription === "loading" ? <div
            // className="flex justify-center items-center h-full w-full mt-28"
            >
              {/* <Spinner accessibilityLabel="Spinner example" size="large" /> */}
            </div> :
              <>
                {!anySubscription && <div className="start_price_container">
                  <div className="start_price_container_heading">
                    <Text variant="headingLg" as="h5">
                      Choose a plan and start Growing!
                    </Text>
                  </div>
                  <div className="start_price_container_cards">
                    <Card>
                      <div className="start_price_choose_plan">
                        <div className='start_plan_name'>Free Plan</div>
                        <div className="start_plan_ammount_section" style={{ marginBottom: "75px" }}>
                          <div className="start_plan_ammount">Free</div>
                        </div>

                        <div className="start_plan_button_section"><Button size='large' loading={isLoadingPlanButton} onClick={() => handlePlanSelect('Free')} variant='primary' fullWidth>select</Button></div>
                        <div className="star_plan_limit_dialogue">
                          <ul className='start_plan_list'>
                            <li className='start_plan_list_item'>Up to 5 sales recovery carts</li>
                            <li className='start_plan_list_item'>Potential to generate up to $1,000 in additional revenue per month!</li>
                          </ul>
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <div className="start_price_choose_plan">
                        <div className='start_plan_name'>Starter</div>
                        <div className="start_plan_ammount_section">
                          <div className="start_plan_ammount">19$</div>
                          <div className="start_plan_ammount_suffix">/  Month</div>
                        </div>
                        <div className="start_plan_trial"><Badge size="small" tone="info">7 day free trial</Badge> </div>
                        <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Starter')} variant='primary' fullWidth>select</Button></div>
                        <div className="star_plan_limit_dialogue">
                          <ul className='start_plan_list'>
                            <li className='start_plan_list_item'>Up to 10 sales recovery carts per month</li>
                            <li className='start_plan_list_item'>Potential to generate up to $2,000 in additional revenue per month!</li>
                          </ul>
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <div className="start_price_choose_plan">
                        <div className='start_plan_name'>Pro</div>
                        <div className="start_plan_ammount_section">
                          <div className="start_plan_ammount">49$</div>
                          <div className="start_plan_ammount_suffix">/  Month</div>
                        </div>
                        <div className="start_plan_trial"><Badge tone="info">7 day free trial</Badge> </div>
                        <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Pro')} variant='primary' fullWidth>select</Button></div>
                        <div className="star_plan_limit_dialogue">
                          <ul className='start_plan_list'>
                            <li className='start_plan_list_item'>Up to 49 sales recovery carts per month</li>
                            <li className='start_plan_list_item'>Potential to generate up to $10,000 in additional revenue per month!</li>
                          </ul>

                        </div>
                      </div>
                      <div className='popular_badge'>
                        Most Popular
                      </div>
                    </Card>
                    <Card>
                      <div className="start_price_choose_plan">
                        <div className='start_plan_name'>Advanced</div>
                        <div className="start_plan_ammount_section">
                          <div className="start_plan_ammount">99$</div>
                          <div className="start_plan_ammount_suffix">/  Month</div>
                        </div>
                        <div className="start_plan_trial"><Badge tone="info">7 day free trial</Badge> </div>
                        <div className="start_plan_button_section"><Button size='large' onClick={() => handlePlanSelect('Advance')} variant='primary' fullWidth>select</Button></div>
                        <div className="star_plan_limit_dialogue">
                          <ul className='start_plan_list'>
                            <li className='start_plan_list_item'>Up to 100 sales recovery carts per month</li>
                            <li className='start_plan_list_item'>Potential to generate up to $100000 more revenue per month</li>
                          </ul>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>}
              </>
            }
          </div>
        </Page>
      </div>
    </div>
  );
}
