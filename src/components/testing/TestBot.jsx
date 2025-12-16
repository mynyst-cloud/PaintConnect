
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { TestLog } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    Play, 
    Pause, 
    Square, 
    CheckCircle, 
    AlertTriangle, 
    XCircle,
    Monitor,
    Smartphone,
    User as UserIcon,
    Building,
    Paintbrush,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Test execution engine
class TestBotEngine {
    constructor() {
        this.currentRunId = null;
        this.isRunning = false;
        this.shouldStop = false;
        this.currentStep = 0;
        this.totalSteps = 0;
        this.results = [];
    }

    generateRunId() {
        return `testrun_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async log(role, page, device, action, status, message, metadata = {}) {
        const logEntry = {
            test_run_id: this.currentRunId,
            role,
            page,
            device,
            action,
            status,
            message,
            execution_time: Date.now() - this.stepStartTime,
            metadata
        };

        this.results.push(logEntry);
        
        try {
            await TestLog.create(logEntry);
        } catch (error) {
            console.error('Failed to save test log:', error);
        }
    }

    async executeTest(testPlan, onProgress) {
        this.currentRunId = this.generateRunId();
        this.isRunning = true;
        this.shouldStop = false;
        this.currentStep = 0;
        this.totalSteps = testPlan.steps.length;
        this.results = [];

        console.log(`🤖 Starting TestBot run: ${this.currentRunId}`);

        for (const step of testPlan.steps) {
            if (this.shouldStop) {
                await this.log(testPlan.role, 'TestBot', 'system', 'Test Stopped', 'warning', 'Test execution was manually stopped');
                break;
            }

            this.stepStartTime = Date.now();
            this.currentStep++;

            try {
                onProgress({
                    currentStep: this.currentStep,
                    totalSteps: this.totalSteps,
                    currentAction: step.action,
                    device: step.device || 'desktop'
                });

                // Simulate viewport change for mobile tests
                if (step.device === 'mobile') {
                    await this.simulateMobileViewport();
                }

                const result = await step.execute();
                await this.log(
                    testPlan.role, 
                    step.page, 
                    step.device || 'desktop', 
                    step.action, 
                    result.status, 
                    result.message,
                    result.metadata
                );

                // Reset viewport if needed
                if (step.device === 'mobile') {
                    await this.simulateDesktopViewport();
                }

                // Wait between steps
                await this.wait(step.delay || 1000);
                
            } catch (error) {
                await this.log(
                    testPlan.role, 
                    step.page, 
                    step.device || 'desktop', 
                    step.action, 
                    'fail', 
                    `Test execution failed: ${error.message}`,
                    { error: error.stack }
                );
            }
        }

        this.isRunning = false;
        console.log(`🤖 TestBot run completed: ${this.currentRunId}`);
        return this.results;
    }

    async simulateMobileViewport() {
        // Simulate mobile viewport by adding CSS class
        document.body.classList.add('testbot-mobile-viewport');
        const style = document.createElement('style');
        style.id = 'testbot-mobile-style';
        style.textContent = `
            .testbot-mobile-viewport {
                max-width: 375px !important;
                margin: 0 auto;
            }
            .testbot-mobile-viewport * {
                box-sizing: border-box;
            }
        `;
        document.head.appendChild(style);
    }

    async simulateDesktopViewport() {
        document.body.classList.remove('testbot-mobile-viewport');
        const mobileStyle = document.getElementById('testbot-mobile-style');
        if (mobileStyle) {
            mobileStyle.remove();
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stop() {
        this.shouldStop = true;
    }
}

// Test plans for different roles
const createSuperAdminTests = () => ({
    role: 'super_admin',
    name: 'Super Admin Tests',
    steps: [
        {
            page: 'Authentication',
            action: 'Verify super admin login',
            execute: async () => {
                try {
                    const user = await User.me();
                    if (user && user.role === 'admin') {
                        return { status: 'pass', message: 'Super admin authentication verified' };
                    }
                    return { status: 'fail', message: 'Not logged in as super admin' };
                } catch (error) {
                    return { status: 'fail', message: `Auth check failed: ${error.message}` };
                }
            }
        },
        {
            page: 'Dashboard',
            action: 'Load dashboard',
            execute: async () => {
                try {
                    // Navigate to dashboard
                    window.location.hash = '/Dashboard';
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const hasContent = document.querySelector('[data-testid="dashboard-content"], .dashboard, h1');
                    if (hasContent) {
                        return { status: 'pass', message: 'Dashboard loaded successfully' };
                    }
                    return { status: 'warning', message: 'Dashboard content not detected' };
                } catch (error) {
                    return { status: 'fail', message: `Dashboard load failed: ${error.message}` };
                }
            }
        },
        {
            page: 'SuperAdmin',
            action: 'Access super admin panel',
            execute: async () => {
                try {
                    window.location.hash = '/SuperAdmin';
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const adminPanel = document.querySelector('h1, .super-admin, [data-testid="super-admin"]');
                    if (adminPanel) {
                        return { status: 'pass', message: 'Super admin panel accessible' };
                    }
                    return { status: 'fail', message: 'Could not access super admin panel' };
                } catch (error) {
                    return { status: 'fail', message: `Super admin panel access failed: ${error.message}` };
                }
            }
        },
        {
            page: 'Navigation',
            device: 'mobile',
            action: 'Test mobile menu responsiveness',
            execute: async () => {
                try {
                    const mobileMenuButton = document.querySelector('[data-testid="mobile-menu"], .lg\\:hidden button, button[aria-label="Menu"]');
                    if (mobileMenuButton) {
                        mobileMenuButton.click();
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        const mobileNav = document.querySelector('.mobile-nav, [data-testid="mobile-nav"]');
                        if (mobileNav) {
                            return { status: 'pass', message: 'Mobile menu opens correctly' };
                        }
                        return { status: 'warning', message: 'Mobile menu button found but nav not detected' };
                    }
                    return { status: 'warning', message: 'Mobile menu button not found' };
                } catch (error) {
                    return { status: 'fail', message: `Mobile menu test failed: ${error.message}` };
                }
            }
        }
    ]
});

const createPainterCompanyAdminTests = () => ({
    role: 'painter_company_admin',
    name: 'Painter Company Admin Tests',
    steps: [
        {
            page: 'Dashboard',
            action: 'Load company dashboard',
            execute: async () => {
                try {
                    window.location.hash = '/Dashboard';
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const dashboard = document.querySelector('h1, .dashboard, [data-testid="dashboard"]');
                    if (dashboard) {
                        return { status: 'pass', message: 'Company dashboard loaded' };
                    }
                    return { status: 'fail', message: 'Dashboard not accessible' };
                } catch (error) {
                    return { status: 'fail', message: `Dashboard load failed: ${error.message}` };
                }
            }
        },
        {
            page: 'Projecten',
            action: 'Load projects page',
            execute: async () => {
                try {
                    window.location.hash = '/Projecten';
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const projectsPage = document.querySelector('h1, .projects, [data-testid="projects"]');
                    const projectCards = document.querySelectorAll('.project-card, [data-testid="project-card"]');
                    
                    if (projectsPage) {
                        return { 
                            status: 'pass', 
                            message: `Projects page loaded with ${projectCards.length} project cards`,
                            metadata: { projectCount: projectCards.length }
                        };
                    }
                    return { status: 'fail', message: 'Projects page not accessible' };
                } catch (error) {
                    return { status: 'fail', message: `Projects page load failed: ${error.message}` };
                }
            }
        },
        {
            page: 'Planning',
            action: 'Load planning calendar',
            execute: async () => {
                try {
                    window.location.hash = '/Planning';
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const calendar = document.querySelector('.calendar, [data-testid="calendar"], .planning-calendar');
                    const actionButtons = document.querySelectorAll('button');
                    
                    if (calendar) {
                        return { 
                            status: 'pass', 
                            message: `Planning calendar loaded with ${actionButtons.length} interactive buttons`,
                            metadata: { buttonCount: actionButtons.length }
                        };
                    }
                    return { status: 'warning', message: 'Planning page loaded but calendar not detected' };
                } catch (error) {
                    return { status: 'fail', message: `Planning page load failed: ${error.message}` };
                }
            }
        },
        {
            page: 'AccountSettings',
            action: 'Test team management functionality',
            execute: async () => {
                try {
                    window.location.hash = '/AccountSettings';
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const teamTab = document.querySelector('[value="team"], .tab-team, [data-testid="team-tab"]');
                    const inviteForm = document.querySelector('.invite-form, [data-testid="invite-form"], form');
                    
                    if (teamTab || inviteForm) {
                        return { status: 'pass', message: 'Team management interface accessible' };
                    }
                    return { status: 'warning', message: 'Account settings loaded but team management not found' };
                } catch (error) {
                    return { status: 'fail', message: `Team management test failed: ${error.message}` };
                }
            }
        },
        {
            page: 'Materialen',
            device: 'mobile',
            action: 'Test materials page mobile layout',
            execute: async () => {
                try {
                    window.location.hash = '/Materialen';
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const materialsPage = document.querySelector('h1, .materials, [data-testid="materials"]');
                    const addButton = document.querySelector('button');
                    
                    if (materialsPage && addButton) {
                        return { status: 'pass', message: 'Materials page mobile layout functional' };
                    }
                    return { status: 'warning', message: 'Materials page loaded but elements not fully responsive' };
                } catch (error) {
                    return { status: 'fail', message: `Materials mobile test failed: ${error.message}` };
                }
            }
        }
    ]
});

const createPainterTests = () => ({
    role: 'painter',
    name: 'Painter User Tests',
    steps: [
        {
            page: 'Dashboard',
            action: 'Access painter dashboard',
            execute: async () => {
                try {
                    window.location.hash = '/Dashboard';
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const dashboard = document.querySelector('h1, .dashboard, [data-testid="dashboard"]');
                    if (dashboard) {
                        return { status: 'pass', message: 'Painter dashboard accessible' };
                    }
                    return { status: 'fail', message: 'Painter dashboard not accessible' };
                } catch (error) {
                    return { status: 'fail', message: `Painter dashboard test failed: ${error.message}` };
                }
            }
        },
        {
            page: 'TeamChat',
            action: 'Load team chat',
            execute: async () => {
                try {
                    window.location.hash = '/TeamChat';
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const chatInterface = document.querySelector('.chat, [data-testid="chat"], .team-chat');
                    const messageInput = document.querySelector('input[type="text"], textarea');
                    
                    if (chatInterface && messageInput) {
                        return { status: 'pass', message: 'Team chat interface functional' };
                    }
                    return { status: 'warning', message: 'Team chat loaded but interface incomplete' };
                } catch (error) {
                    return { status: 'fail', message: `Team chat test failed: ${error.message}` };
                }
            }
        },
        {
            page: 'Projecten',
            device: 'mobile',
            action: 'Test projects mobile view',
            execute: async () => {
                try {
                    window.location.hash = '/Projecten';
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const projectsGrid = document.querySelector('.grid, .projects-grid, [data-testid="projects-grid"]');
                    const projectCards = document.querySelectorAll('.project-card, [data-testid="project-card"]');
                    
                    if (projectsGrid && projectCards.length > 0) {
                        return { 
                            status: 'pass', 
                            message: `Projects mobile view shows ${projectCards.length} projects`,
                            metadata: { mobileProjectsVisible: projectCards.length }
                        };
                    }
                    return { status: 'warning', message: 'Projects page loaded but mobile layout needs attention' };
                } catch (error) {
                    return { status: 'fail', message: `Projects mobile test failed: ${error.message}` };
                }
            }
        }
    ]
});

export default function TestBot() {
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState({ currentStep: 0, totalSteps: 0, currentAction: '', device: 'desktop' });
    const [results, setResults] = useState([]);
    const [selectedRole, setSelectedRole] = useState('super_admin');
    const engineRef = useRef(new TestBotEngine());

    const testPlans = useMemo(() => ({
        super_admin: createSuperAdminTests(),
        painter_company_admin: createPainterCompanyAdminTests(),
        painter: createPainterTests()
    }), []);

    const handleStartTest = useCallback(async () => {
        if (isRunning) return;
        
        setIsRunning(true);
        setResults([]);
        setProgress({ currentStep: 0, totalSteps: 0, currentAction: 'Initializing...', device: 'desktop' });

        try {
            const testPlan = testPlans[selectedRole];
            const testResults = await engineRef.current.executeTest(testPlan, setProgress);
            setResults(testResults);
        } catch (error) {
            console.error('Test execution failed:', error);
        } finally {
            setIsRunning(false);
        }
    }, [selectedRole, isRunning, testPlans]);

    const handleStopTest = useCallback(() => {
        if (engineRef.current) {
            engineRef.current.stop();
        }
        setIsRunning(false);
    }, []);

    const getRoleIcon = (role) => {
        switch (role) {
            case 'super_admin': return UserIcon;
            case 'painter_company_admin': return Building;
            case 'painter': return Paintbrush;
            case 'client': return Users;
            default: return UserIcon;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pass': return CheckCircle;
            case 'warning': return AlertTriangle;
            case 'fail': return XCircle;
            default: return CheckCircle;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pass': return 'text-green-600';
            case 'warning': return 'text-yellow-600';
            case 'fail': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const progressPercentage = progress.totalSteps > 0 ? (progress.currentStep / progress.totalSteps) * 100 : 0;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        🤖 PaintConnect TestBot
                        <Badge variant="outline">v1.0</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <select 
                                value={selectedRole} 
                                onChange={(e) => setSelectedRole(e.target.value)}
                                disabled={isRunning}
                                className="px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="super_admin">🔧 Super Admin</option>
                                <option value="painter_company_admin">🏢 Painter Company Admin</option>
                                <option value="painter">🎨 Painter</option>
                            </select>
                            
                            {isRunning && (
                                <div className="flex items-center gap-2">
                                    {progress.device === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                    <span className="text-sm text-gray-600">{progress.device}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            {!isRunning ? (
                                <Button onClick={handleStartTest} className="bg-emerald-600 hover:bg-emerald-700">
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Tests
                                </Button>
                            ) : (
                                <Button onClick={handleStopTest} variant="destructive">
                                    <Square className="w-4 h-4 mr-2" />
                                    Stop Tests
                                </Button>
                            )}
                        </div>
                    </div>

                    {isRunning && (
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">
                                    Step {progress.currentStep} of {progress.totalSteps}
                                </span>
                                <span className="text-sm text-gray-600">
                                    {Math.round(progressPercentage)}%
                                </span>
                            </div>
                            <Progress value={progressPercentage} className="mb-2" />
                            <p className="text-sm text-gray-700">
                                {progress.currentAction}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {results.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Test Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            <AnimatePresence>
                                {results.map((result, index) => {
                                    const StatusIcon = getStatusIcon(result.status);
                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                                        >
                                            <StatusIcon className={`w-5 h-5 mt-0.5 ${getStatusColor(result.status)}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm">{result.page}</span>
                                                    <Badge variant="outline" size="sm">
                                                        {result.device}
                                                    </Badge>
                                                    <span className="text-xs text-gray-500">
                                                        {result.execution_time}ms
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{result.action}</p>
                                                <p className={`text-sm ${getStatusColor(result.status)}`}>
                                                    {result.message}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
