
export const isProPlanOrHigher = (planName: any) => {
    // console.log("planName from isProPlanOrHigher", planName);
    if (planName) {
        if (planName === "Pro" || planName === "Advance") return true
        else return false
    } else return false
}
