export async function withRetry<T>(
    operationName: string,
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 2000
): Promise<T> {
    let retries = maxRetries;
    let delay = initialDelayMs;

    while (retries > 0) {
        try {
            return await operation();
        } catch (err: any) {
            const isRateLimit =
                err?.status === 429 ||
                err?.message?.includes('429') ||
                err?.message?.includes('Too Many Requests') ||
                err?.message?.includes('Quota');

            if (isRateLimit && retries > 1) {
                console.warn(
                    `[${operationName}] Rate limit hit. Retrying in ${delay}ms... (${retries - 1} retries left)`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                retries--;
                delay *= 2; // Exponential backoff
            } else {
                throw err;
            }
        }
    }

    // Fallback error, though normally the `throw err` above should handle exiting the loop
    throw new Error(`[${operationName}] Operation failed after ${maxRetries} retries.`);
}
