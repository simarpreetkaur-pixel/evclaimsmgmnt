export declare function initAckoAnalytics(anonymousId: string, writeKey: string): string;
export declare function waitForAnalyticsLoad(timeoutMs?: number): Promise<void>;
export declare function trackEvent(eventName: string, properties?: Record<string, unknown>): void;
export declare function pageEvent(eventName: string, properties?: Record<string, unknown>): void;
