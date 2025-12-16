// Simulates a background job queue for long-running tasks (e.g., report generation)
class JobQueueService {
  constructor() {
    this.jobs = [];
    this.jobStatus = new Map();
    this.isProcessing = false;
    setInterval(() => this.processQueue(), 5000); // Process queue every 5 seconds
  }

  addJob(job) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.jobs.push({ ...job, id: jobId });
    this.jobStatus.set(jobId, { status: 'pending', progress: 0, result: null });
    return jobId;
  }

  getJobStatus(jobId) {
    return this.jobStatus.get(jobId);
  }

  async processQueue() {
    if (this.isProcessing || this.jobs.length === 0) {
      return;
    }

    this.isProcessing = true;
    const job = this.jobs.shift();

    try {
      this.jobStatus.set(job.id, { status: 'running', progress: 25, result: null });
      
      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, 3000));
      this.jobStatus.set(job.id, { status: 'running', progress: 75, result: null });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate a result
      const result = { success: true, message: `${job.type} voltooid`, dataUrl: 'simulated/data/url' };
      this.jobStatus.set(job.id, { status: 'completed', progress: 100, result });

    } catch (error) {
      this.jobStatus.set(job.id, { status: 'failed', progress: 0, result: { error: error.message } });
    } finally {
      this.isProcessing = false;
    }
  }
}

const jobQueue = new JobQueueService();
export default jobQueue;