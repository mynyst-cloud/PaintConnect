import { errorTracker } from './errorTracker';

class PerformanceMonitor {
  constructor() {
    this.observations = [];
    this.thresholds = {
      largestContentfulPaint: 2500, // 2.5s
      firstInputDelay: 100, // 100ms
      cumulativeLayoutShift: 0.1,
      longTask: 50, // 50ms
    };
    
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;
    
    // Monitor Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeLongTasks();
    
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => this.reportPageLoadMetrics(), 1000);
    });
  }

  observeLCP() {
    if (!window.PerformanceObserver) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry.startTime > this.thresholds.largestContentfulPaint) {
        errorTracker.captureCustomError(
          `Poor LCP: ${Math.round(lastEntry.startTime)}ms (threshold: ${this.thresholds.largestContentfulPaint}ms)`,
          'performance_warning',
          {
            metric: 'LCP',
            value: lastEntry.startTime,
            threshold: this.thresholds.largestContentfulPaint,
            element: lastEntry.element?.tagName || 'unknown'
          }
        );
      }
    });
    
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }
  }

  observeFID() {
    if (!window.PerformanceObserver) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.processingStart - entry.startTime > this.thresholds.firstInputDelay) {
          errorTracker.captureCustomError(
            `Poor FID: ${Math.round(entry.processingStart - entry.startTime)}ms (threshold: ${this.thresholds.firstInputDelay}ms)`,
            'performance_warning',
            {
              metric: 'FID',
              value: entry.processingStart - entry.startTime,
              threshold: this.thresholds.firstInputDelay,
              eventType: entry.name
            }
          );
        }
      });
    });
    
    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }
  }

  observeCLS() {
    if (!window.PerformanceObserver) return;
    
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      if (clsValue > this.thresholds.cumulativeLayoutShift) {
        errorTracker.captureCustomError(
          `Poor CLS: ${clsValue.toFixed(3)} (threshold: ${this.thresholds.cumulativeLayoutShift})`,
          'performance_warning',
          {
            metric: 'CLS',
            value: clsValue,
            threshold: this.thresholds.cumulativeLayoutShift
          }
        );
      }
    });
    
    try {
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }
  }

  observeLongTasks() {
    if (!window.PerformanceObserver) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > this.thresholds.longTask) {
          errorTracker.captureCustomError(
            `Long task detected: ${Math.round(entry.duration)}ms (threshold: ${this.thresholds.longTask}ms)`,
            'performance_warning',
            {
              metric: 'Long Task',
              duration: entry.duration,
              threshold: this.thresholds.longTask,
              startTime: entry.startTime
            }
          );
        }
      });
    });
    
    try {
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long tasks not supported
    }
  }

  reportPageLoadMetrics() {
    if (!window.performance || !window.performance.timing) return;
    
    const timing = window.performance.timing;
    const navigation = window.performance.navigation;
    
    const metrics = {
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
      timeToInteractive: 0
    };

    // Get paint metrics
    if (window.performance.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') {
          metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime;
        }
      });
    }

    // Track slow page loads
    if (metrics.pageLoadTime > 5000) {
      errorTracker.captureCustomError(
        `Slow page load: ${Math.round(metrics.pageLoadTime)}ms`,
        'performance_warning',
        {
          ...metrics,
          navigationType: navigation.type,
          url: window.location.href
        }
      );
    }

    // Store metrics for potential reporting
    this.observations.push({
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...metrics
    });

    // Keep only last 10 observations
    if (this.observations.length > 10) {
      this.observations = this.observations.slice(-10);
    }
  }

  getMetrics() {
    return {
      observations: this.observations,
      thresholds: this.thresholds
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;