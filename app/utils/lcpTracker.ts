
export const trackLCP = (pageName: string) => {
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
                // console.log(`Page: ${pageName} LCP: ${entry.startTime}`);
            }
        }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });

};
