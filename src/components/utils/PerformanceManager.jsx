import React from 'react';

// Enterprise Performance Manager
class PerformanceManager {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      queryTime: 2000, // 2 seconds
      renderTime: 100,  // 100ms
      memoryUsage: 100 * 1024 * 1024 // 100MB
    };
    this.alerts = [];
  }

  // Monitor component render performance
  measureRender(componentName, renderFunction) {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    try {
      const result = renderFunction();
      
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();
      
      this.recordMetric('render', {
        component: componentName,
        duration: endTime - startTime,
        memoryDelta: endMemory - startMemory,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      this.recordError('render', componentName, error);
      throw error;
    }
  }

  // Monitor async operations
  async measureAsync(operationName, asyncFunction) {
    const startTime = performance.now();
    
    try {
      const result = await asyncFunction();
      const duration = performance.now() - startTime;
      
      this.recordMetric('async', {
        operation: operationName,
        duration,
        timestamp: Date.now(),
        success: true
      });
      
      if (duration > this.thresholds.queryTime) {
        this.addAlert('SLOW_QUERY', `${operationName} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric('async', {
        operation: operationName,
        duration,
        timestamp: Date.now(),
        success: false,
        error: error.message
      });
      
      this.recordError('async', operationName, error);
      throw error;
    }
  }

  recordMetric(type, data) {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    const metrics = this.metrics.get(type);
    metrics.push(data);
    
    // Keep only last 1000 metrics per type
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }
  }

  recordError(type, operation, error) {
    console.error(`Performance Manager - ${type} error in ${operation}:`, error);
    
    this.addAlert('ERROR', `${operation}: ${error.message}`);
  }

  addAlert(severity, message) {
    this.alerts.push({
      severity,
      message,
      timestamp: Date.now()
    });
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.splice(0, this.alerts.length - 100);
    }
  }

  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  // Get performance report
  getReport() {
    const report = {
      timestamp: Date.now(),
      alerts: this.alerts.slice(-10), // Last 10 alerts
      metrics: {},
      summary: {}
    };

    // Generate metric summaries
    for (const [type, metrics] of this.metrics) {
      const recent = metrics.slice(-100); // Last 100 metrics
      
      if (type === 'render') {
        const durations = recent.map(m => m.duration);
        report.metrics[type] = {
          count: recent.length,
          avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
          maxDuration: Math.max(...durations),
          slowComponents: recent
            .filter(m => m.duration > this.thresholds.renderTime)
            .map(m => m.component)
        };
      }
      
      if (type === 'async') {
        const successful = recent.filter(m => m.success);
        const failed = recent.filter(m => !m.success);
        
        report.metrics[type] = {
          total: recent.length,
          successful: successful.length,
          failed: failed.length,
          avgDuration: successful.length > 0 
            ? successful.reduce((a, b) => a + b.duration, 0) / successful.length 
            : 0,
          slowOperations: recent
            .filter(m => m.duration > this.thresholds.queryTime)
            .map(m => m.operation)
        };
      }
    }

    return report;
  }

  // Memory cleanup
  cleanup() {
    // Clear old metrics
    for (const [type, metrics] of this.metrics) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const filtered = metrics.filter(m => m.timestamp > oneHourAgo);
      this.metrics.set(type, filtered);
    }
    
    // Clear old alerts
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo);
  }
}

// Virtual List Component for handling thousands of items
export class VirtualList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      startIndex: 0,
      endIndex: Math.min(props.items.length, props.itemsPerPage || 50)
    };
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    this.updateVisibleItems();
    if (this.containerRef.current) {
      this.containerRef.current.addEventListener('scroll', this.handleScroll);
    }
  }

  componentWillUnmount() {
    if (this.containerRef.current) {
      this.containerRef.current.removeEventListener('scroll', this.handleScroll);
    }
  }

  handleScroll = () => {
    if (this.containerRef.current) {
      const { scrollTop, clientHeight } = this.containerRef.current;
      const itemHeight = this.props.itemHeight || 100;
      
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(clientHeight / itemHeight) + 5, // 5 item buffer
        this.props.items.length
      );
      
      this.setState({ startIndex, endIndex });
    }
  };

  updateVisibleItems() {
    // Implementation for updating visible items based on scroll position
    this.handleScroll();
  }

  render() {
    const { items, renderItem, itemHeight = 100 } = this.props;
    const { startIndex, endIndex } = this.state;
    
    const visibleItems = items.slice(startIndex, endIndex);
    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    return (
      <div 
        ref={this.containerRef}
        style={{ height: '400px', overflow: 'auto' }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map((item, index) => 
              renderItem(item, startIndex + index)
            )}
          </div>
        </div>
      </div>
    );
  }
}

const performanceManager = new PerformanceManager();

// Auto cleanup every hour
setInterval(() => {
  performanceManager.cleanup();
}, 60 * 60 * 1000);

export default performanceManager;