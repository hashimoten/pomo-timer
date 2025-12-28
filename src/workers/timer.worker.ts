/* eslint-disable no-restricted-globals */
// Use basic interval logic in worker to avoid main thread throttling
let interval: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e) => {
    const { action } = e.data;

    if (action === 'start') {
        if (interval) clearInterval(interval);
        interval = setInterval(() => {
            self.postMessage({ type: 'tick' });
        }, 1000);
    } else if (action === 'stop' || action === 'pause') {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    }
};

export { };
