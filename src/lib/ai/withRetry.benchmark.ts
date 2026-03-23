import { withRetry } from './withRetry';

export async function simulateAIFetch(shouldFailCount: number) {
    let attempts = 0;
    return async () => {
        attempts++;
        if (attempts <= shouldFailCount) {
            const err: any = new Error("Too Many Requests");
            err.status = 429;
            throw err;
        }
        return { success: true, attempts };
    };
}

async function runBenchmarkBefore() {
    console.log("Running before-refactor simulation...");
    const mockApi = await simulateAIFetch(1); // Fail once

    const start = Date.now();
    let result: any;
    let retries = 3;
    let delay = 100; // Use small delay for benchmark

    while (retries > 0) {
        try {
            result = await mockApi();
            break;
        } catch (err: any) {
            const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Too Many Requests');
            if (isRateLimit && retries > 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
                retries--;
                delay *= 2;
            } else {
                throw err;
            }
        }
    }

    const time = Date.now() - start;
    console.log(`Before refactor completed in ${time}ms (mocked API called ${result.attempts} times)`);
}

async function runBenchmarkAfter() {
    console.log("Running after-refactor simulation...");
    const mockApi = await simulateAIFetch(1); // Fail once

    const start = Date.now();

    const result = await withRetry("benchmark", mockApi, 3, 100);

    const time = Date.now() - start;
    console.log(`After refactor completed in ${time}ms (mocked API called ${result.attempts} times)`);
}

async function run() {
    await runBenchmarkBefore();
    await runBenchmarkAfter();
}

run().catch(console.error);
