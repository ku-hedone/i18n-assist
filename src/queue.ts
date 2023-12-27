interface Task {
    task: (...args: unknown[]) => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void
}

class AsyncQueue {
    private max: number;
    private delay: number;
    private running: number;
    private queue: Task[];
    private lastTime!: number;
    private resolveAll!: () => void;
    private allTasksDone: Promise<void>;

    constructor(max = 3, delay = 50) {
        this.max = max;
        this.delay = delay;
        this.running = 0;
        this.queue = [];
        this.allTasksDone = new Promise((resolve) => {
            this.resolveAll = resolve;
        })
    }

    // 添加任务到队列
    enqueue(task: Task['task']) {
        new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.dequeue();
        })
    }

    // 从队列中取出任务执行
    async dequeue() {
        if (this.running < this.max && this.queue.length) {
            this.running++;
            const item = this.queue.shift();
            if (item) {
                const { task, resolve, reject } = item;
                try {
                    const now = Date.now();
                    if (this.lastTime) {
                        const diff = now - this.lastTime;
                        if (diff <= this.delay) {
                            // 延迟执行
                            await new Promise((resolve) => setTimeout(resolve, diff));
                        }
                    }
                    this.lastTime = now;
                    const res = await task();
                    resolve(res);
                } catch (e) {
                    reject(e as unknown as string);
                } finally {
                    this.running--;
                    if (this.queue.length === 0 && this.running === 0) {
                        this.resolveAll();
                    } else {
                        this.dequeue();
                    }
                }
            }
        }
    }
      // 等待所有任务完成
    async waitUntilAllTasksDone() {
        await this.allTasksDone;
    }
}
export default AsyncQueue;