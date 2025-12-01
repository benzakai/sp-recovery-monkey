export const manageOnboarding = async ({ data }: any = {}) => {

    try {
        const response = await fetch('/api/onboarding_update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        await response.json();
    } catch (error) {
        console.log("error occured on manageOnboarding", error);
    }
}