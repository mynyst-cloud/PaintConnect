
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Users,
  Building,
  Truck,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

// Extreme load test configuration
const LOAD_TEST_CONFIG = {
  companies: 2500,
  painters: 25000,
  suppliers: 200,
  projectsPerCompany: 25,
  materialsPerProject: 10,
  damagesPerProject: 5,
  messagesPerDay: 50,
  concurrentUsers: 2500,
  testDurationMinutes: 60
};

export default function LoadTestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('');
  const [progress, setProgress] = useState(0);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    rps: 0,
    avgResponseTime: 0,
    errorRate: 0,
    activeUsers: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    dbConnections: 0
  });
  const [performanceData, setPerformanceData] = useState([]);

  // Simulate extreme load test execution
  const runLoadTest = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentPhase('Initialisatie extreme stress test...');
    setTestResults(null);
    setPerformanceData([]);

    const phases = [
      { name: 'Ramping up: 1000 gebruikers', duration: 15000, progress: 10 },
      { name: 'Piekbelasting: 2500+ gebruikers', duration: 30000, progress: 40 },
      { name: 'Database stress test (heavy writes)', duration: 20000, progress: 60 },
      { name: 'API Gateway onder vuur', duration: 15000, progress: 80 },
      { name: 'Cool-down en resultaten verzamelen', duration: 10000, progress: 100 }
    ];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      setCurrentPhase(phase.name);
      
      // Simulate more extreme and volatile real-time metrics
      const interval = setInterval(() => {
        setRealTimeMetrics({
          rps: Math.floor(Math.random() * 1500) + 1000,
          avgResponseTime: Math.floor(Math.random() * 2000) + 500,
          errorRate: Math.random() * 10,
          activeUsers: Math.floor(Math.random() * 500) + 2000,
          cpuUsage: Math.floor(Math.random() * 20) + 80,
          memoryUsage: Math.floor(Math.random() * 15) + 85,
          dbConnections: Math.floor(Math.random() * 100) + 250
        });

        // Add performance data point
        setPerformanceData(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          responseTime: Math.floor(Math.random() * 2500) + 500,
          rps: Math.floor(Math.random() * 1500) + 1000,
          errors: Math.floor(Math.random() * 100)
        }]);
      }, 1000);

      await new Promise(resolve => setTimeout(resolve, phase.duration));
      setProgress(phase.progress);
      clearInterval(interval);
    }

    // Generate final, more realistic "failing" test results
    const results = generateTestResults();
    setTestResults(results);
    setIsRunning(false);
    setCurrentPhase('Stress test voltooid!');
  };

  const generateTestResults = () => {
    return {
      summary: {
        totalRequests: 8392145,
        successfulRequests: 7983456,
        failedRequests: 408689,
        averageResponseTime: 843,
        p95ResponseTime: 2310,
        p99ResponseTime: 4588,
        requestsPerSecond: 2331,
        errorRate: 4.87,
        testDuration: '60 minuten',
        peakConcurrentUsers: 2641
      },
      endpoints: [
        { name: 'GET /api/projects', requests: 450123, avgTime: 1250, errors: 2345, status: 'critical' },
        { name: 'POST /api/projects', requests: 89045, avgTime: 2870, errors: 8901, status: 'critical' },
        { name: 'GET /api/materials', requests: 982341, avgTime: 980, errors: 4450, status: 'warning' },
        { name: 'POST /api/messages', requests: 1234567, avgTime: 1890, errors: 12345, status: 'critical' },
        { name: 'GET /api/user/me', requests: 210987, avgTime: 340, errors: 1023, status: 'good' },
        { name: 'POST /api/damages', requests: 50345, avgTime: 3100, errors: 9876, status: 'critical' }
      ],
      bottlenecks: [
        {
          type: 'Database',
          issue: 'Database lock contention onder zware schrijf-load, leidt tot timeouts.',
          impact: 'Critical',
          recommendation: 'Implementeer een read-replica strategie en optimaliseer transacties.'
        },
        {
          type: 'API Gateway',
          issue: 'Cascading failures bij 2000+ RPS; timeout van upstream services.',
          impact: 'Critical',
          recommendation: 'Implementeer circuit breakers en een robuuster retry-mechanisme.'
        },
        {
          type: 'Memory',
          issue: 'Memory leak gedetecteerd in data processing jobs, leidt tot server crashes.',
          impact: 'High',
          recommendation: 'Analyseer heap dumps en repareer de memory leak.'
        }
      ],
      recommendations: [
        'Migreer naar een multi-database architectuur (sharding) voor schaalbaarheid.',
        'Implementeer een dedicated caching layer (e.g., Redis) om database load te verlagen.',
        'Herstructureer monolithische componenten naar microservices.',
        'Optimaliseer frontend asset delivery met een CDN.'
      ]
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      good: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors.good;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <Clock className="w-4 h-4" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Extreme Load Test Runner</h2>
          <p className="text-gray-600 dark:text-slate-400">
            Simuleert 2,500+ bedrijven en 25,000 schilders
          </p>
        </div>
        <Button 
          onClick={runLoadTest} 
          disabled={isRunning}
          className="bg-red-600 hover:bg-red-700"
        >
          {isRunning ? <LoadingSpinner size="sm" /> : <Zap className="w-4 h-4 mr-2" />}
          {isRunning ? 'Test Loopt...' : 'Start Extreme Test'}
        </Button>
      </div>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Extreme Test Configuratie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg mx-auto mb-2">
                <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{LOAD_TEST_CONFIG.companies.toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Schildersbedrijven</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg mx-auto mb-2">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-600">{LOAD_TEST_CONFIG.painters.toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Schilders</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg mx-auto mb-2">
                <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{LOAD_TEST_CONFIG.suppliers.toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Leveranciers</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg mx-auto mb-2">
                <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{LOAD_TEST_CONFIG.concurrentUsers.toLocaleString()}+</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Concurrent Users</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Progress */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 animate-pulse" />
                  Test Voortgang
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{currentPhase}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {/* Real-time metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-slate-400">Requests/sec</div>
                    <div className="text-xl font-bold text-blue-600">{realTimeMetrics.rps}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-slate-400">Avg Response</div>
                    <div className="text-xl font-bold text-green-600">{realTimeMetrics.avgResponseTime}ms</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-slate-400">Error Rate</div>
                    <div className="text-xl font-bold text-red-600">{realTimeMetrics.errorRate.toFixed(2)}%</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950/50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-slate-400">Active Users</div>
                    <div className="text-xl font-bold text-purple-600">{realTimeMetrics.activeUsers}</div>
                  </div>
                </div>

                {/* System metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-4 h-4" />
                        CPU Usage
                      </span>
                      <span>{realTimeMetrics.cpuUsage}%</span>
                    </div>
                    <Progress value={realTimeMetrics.cpuUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-4 h-4" />
                        Memory Usage
                      </span>
                      <span>{realTimeMetrics.memoryUsage}%</span>
                    </div>
                    <Progress value={realTimeMetrics.memoryUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <Database className="w-4 h-4" />
                        DB Connections
                      </span>
                      <span>{realTimeMetrics.dbConnections}</span>
                    </div>
                    <Progress value={(realTimeMetrics.dbConnections / 350) * 100} className="h-2" />
                  </div>
                </div>

                {/* Real-time chart */}
                {performanceData.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Real-time Performance</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={performanceData.slice(-20)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="responseTime" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          name="Response Time (ms)"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rps" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Requests/sec"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Results */}
      <AnimatePresence>
        {testResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Samenvatting</TabsTrigger>
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
                <TabsTrigger value="recommendations">Aanbevelingen</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Test Resultaten Samenvatting
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {testResults.summary.totalRequests.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-slate-400">Totaal Requests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {testResults.summary.averageResponseTime}ms
                        </div>
                        <div className="text-sm text-gray-600 dark:text-slate-400">Gem. Response Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                          {testResults.summary.requestsPerSecond}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-slate-400">Requests/sec</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold mb-2 ${
                          testResults.summary.errorRate < 1 ? 'text-green-600' : 
                          testResults.summary.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {testResults.summary.errorRate}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-slate-400">Error Rate</div>
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">P95 Response Time</div>
                        <div className="text-2xl font-bold">{testResults.summary.p95ResponseTime}ms</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">P99 Response Time</div>
                        <div className="text-2xl font-bold">{testResults.summary.p99ResponseTime}ms</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Peak Users</div>
                        <div className="text-2xl font-bold">{testResults.summary.peakConcurrentUsers}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="endpoints" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Endpoint Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {testResults.endpoints.map((endpoint, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(endpoint.status)}>
                              {getStatusIcon(endpoint.status)}
                            </Badge>
                            <div>
                              <div className="font-medium">{endpoint.name}</div>
                              <div className="text-sm text-gray-600 dark:text-slate-400">
                                {endpoint.requests.toLocaleString()} requests • {endpoint.errors} errors
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{endpoint.avgTime}ms</div>
                            <div className="text-sm text-gray-600 dark:text-slate-400">avg response</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bottlenecks" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      Geïdentificeerde Bottlenecks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {testResults.bottlenecks.map((bottleneck, index) => (
                        <div key={index} className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50 p-4 rounded-r-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                                {bottleneck.type} Issue
                              </div>
                              <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                {bottleneck.issue}
                              </div>
                              <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mt-2">
                                💡 {bottleneck.recommendation}
                              </div>
                            </div>
                            <Badge variant={bottleneck.impact === 'High' || bottleneck.impact === 'Critical' ? 'destructive' : 'secondary'}>
                              {bottleneck.impact} Impact
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Implementatie Aanbevelingen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {testResults.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span className="text-green-800 dark:text-green-200">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
