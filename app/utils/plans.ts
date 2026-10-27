// yearly plans share the same features as their monthly plan, e.g. "Pro Yearly" -> "Pro"
export const getBasePlanName = (planName: any) => {
    if (typeof planName !== "string") return planName;
    return planName.replace(/ Yearly$/, "");
}

export const isProPlanOrHigher = (planName: any) => {
    // console.log("planName from isProPlanOrHigher", planName);
    const basePlanName = getBasePlanName(planName);
    if (basePlanName) {
        if (basePlanName !== "Free" && basePlanName !== "Starter") return true
        else return false
    } else return false
}

export const isAdvancePlanOrHigher = (planName: any) => {
    // console.log("planName from isProPlanOrHigher", planName);
    const basePlanName = getBasePlanName(planName);
    if (basePlanName) {
        if (basePlanName !== "Free" && basePlanName !== "Starter" && basePlanName !== "Pro") return true
        else return false
    } else return false
}
