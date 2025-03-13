import { Spinner, Card, Button, Text, Page, Badge } from '@shopify/polaris';
import { useNavigate, useActionData, useSubmit, useOutletContext } from '@remix-run/react';
import '../StartPage.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import StartPageCartSummary from '~/components/StartPageCartSummary';
import { authenticate, MONTHLY_PLAN } from '~/shopify.server';
import fireStoreCreateService from '~/services/fireStoreCreateService';
import DashboardSVG from '~/components/SVGs/DashboardSVG';
import CustomerListSVG from '~/components/SVGs/CustomerListSVG';
import Dashboard2SVG from '~/components/SVGs/Dashboard2SVG';
import ChatSVG from '~/components/SVGs/ChatSVG';
import MailSVG from '~/components/SVGs/MailSVG';

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
  const { session, billing } = await authenticate.admin(request)
  const formData = await request.formData();
  const planName = formData.get("planName") || MONTHLY_PLAN;
  if (planName === "Free") {
    await fireStoreCreateService("subscriptions", session.shop, {
      storeId: session.shop,
      plan: "Free",
      status: "ACTIVE",
      startDate: new Date().toISOString(),
      endDate: ""
    }, {});
  } else {
    await billing.require({
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
  const navigate = useNavigate();
  const [planName, setPlanName] = useState('not set');
  const [isLoadingPlanButton, setLoadingPlanButton] = useState(false);
  const submit = useSubmit();
  const actionData = useActionData();
  const { anySubscription, setAnySubscription, setSelectedPlanName }: any = useOutletContext();
  const anySubscriptionRef = useRef(anySubscription);
  const getCards = useMemo(
    () => [
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
    ],
    [anySubscriptionRef.current]);

  const handleIconsNavigate = useCallback((data: any) => {
    if (anySubscriptionRef.current !== "loading") {
      data ? navigate(data) : shopify.toast.show("Please select a plan to access this page.");
    } else {
      shopify.toast.show('Loading subscription details. Please wait.');
    }
  }, [anySubscription, navigate])

  useEffect(() => {
    if (actionData?.success && planName === "Free") {
      if (planName === "Free") {
        setSelectedPlanName("Free")
        setAnySubscription(true);
        shopify.toast.show("Your subscription is successfully created!");
      }
    }
  }, [actionData, planName, setAnySubscription]);

  useEffect(() => {
    anySubscriptionRef.current = anySubscription;
  }, [anySubscription]);

  const handleRedirectToMail = useCallback(() => {
    try {
      const mailtoLink = `mailto:david@cartkeeper.co`;
      const newWindow = window.open(mailtoLink, '_blank');
      if (!newWindow) {
        throw new Error('Failed to open mail client. The popup might be blocked.');
      }
    } catch (error) {
      console.error("Error on opening a mail:", error);
    }
  }, [])

  const handleRedirectToWhatsapp = useCallback(() => {
    window.open("https://wa.me/+972555081948", "_blank");
  }, [])

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
              <Text variant="heading3xl" as="h3">
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
                  <div className="p-6 shadow-lg rounded-2xl border border-gray-200 relative h-48" style={{ backgroundColor: "#f8faff" }}>
                    <div className='flex flex-row items-center'>
                      <ChatSVG />
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

                  <div className="p-6 shadow-lg rounded-2xl border border-gray-200 relative h-48" style={{ backgroundColor: "#f8faff" }}>
                    <div className='flex flex-row items-center'>
                      <MailSVG />
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

            {anySubscription === "loading" ? (
              <div className="flex justify-center items-center h-full w-full mt-28">
                <Spinner accessibilityLabel="Spinner example" size="large" />
              </div>
            ) : (
              !anySubscription && (
                <div className="start_price_container">
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
                </div>
              )
            )}
          </div>
        </Page>
      </div>
    </div>
  );
}