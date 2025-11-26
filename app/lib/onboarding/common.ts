export const manageOnboarding = async ({ data, shop }: any = {}) => {
    try {
        const response = await fetch('/api/firestore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                collectionName: "onboardingProgress",
                documentName: shop,
                data,
            }),
        });
        await response.json();
    } catch (error) {
        console.log("error occured on manageOnboarding", error);
    }
}