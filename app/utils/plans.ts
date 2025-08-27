export const isProPlanOrHigher = (planName: any) => {
    // console.log("planName from isProPlanOrHigher", planName);
    if (planName) {
        if (planName !== "Free" && planName !== "Starter") return true
        else return false
    } else return false
}

export const isAdvancePlanOrHigher = (planName: any) => {
    // console.log("planName from isProPlanOrHigher", planName);
    if (planName) {
        if (planName !== "Free" && planName !== "Starter" && planName !== "Pro") return true
        else return false
    } else return false
}
