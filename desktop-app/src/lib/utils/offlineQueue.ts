interface QueueItem {
  id: string;
  type: 'submit_attempt' | 'sync_answers';
  data: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'offline_queue';
const MAX_RETRY_COUNT = 3;

export class OfflineQueue {
  static async addItem(item: Omit<QueueItem, 'id' | 'timestamp' | 'retryCount'>) {
    const queueItem: QueueItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
      retryCount: 0,
    };
    const queue = await this.getQueue();
    queue.push(queueItem);
    await this.saveQueue(queue);
  }

  static async getQueue(): Promise<QueueItem[]> {
    try {
      const queueJson = localStorage.getItem(QUEUE_STORAGE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch {
      return [];
    }
  }

  static async saveQueue(queue: QueueItem[]) {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // ignore
    }
  }

  static async removeItem(id: string) {
    const queue = await this.getQueue();
    const filteredQueue = queue.filter((item) => item.id !== id);
    await this.saveQueue(filteredQueue);
  }

  static async clearQueue() {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  }

  static async processQueue(processFn: (item: QueueItem) => Promise<boolean>) {
    const queue = await this.getQueue();
    const processedItems: string[] = [];

    for (const item of queue) {
      try {
        const success = await processFn(item);
        if (success) {
          processedItems.push(item.id);
        } else {
          item.retryCount++;
          if (item.retryCount >= MAX_RETRY_COUNT) {
            processedItems.push(item.id);
          }
        }
      } catch {
        item.retryCount++;
        if (item.retryCount >= MAX_RETRY_COUNT) {
          processedItems.push(item.id);
        }
      }
    }

    const remainingQueue = queue.filter((item) => !processedItems.includes(item.id));
    await this.saveQueue(remainingQueue);

    return {
      processed: processedItems.length,
      remaining: remainingQueue.length,
    };
  }
}