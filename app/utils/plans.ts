
export const isProPlanOrHigher = (planName: any) => {
    if (planName === "Pro" || planName === "Advance") return true
    else return false
}
