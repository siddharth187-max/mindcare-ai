// Offline request queue for localStorage persistence
const QUEUE_KEY = 'mindcare_offline_queue';

export function getQueue() {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToQueue(request) {
  const queue = getQueue();
  queue.push({
    ...request,
    timestamp: Date.now(),
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function syncQueue(apiInstance) {
  const queue = getQueue();
  if (queue.length === 0) return;

  const failed = [];

  for (const req of queue) {
    try {
      await apiInstance({
        method: req.method,
        url: req.url,
        data: req.data,
      });
    } catch {
      failed.push(req);
    }
  }

  if (failed.length > 0) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
  } else {
    clearQueue();
  }

  return { synced: queue.length - failed.length, failed: failed.length };
}
