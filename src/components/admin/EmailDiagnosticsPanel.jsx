import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle, AlertTriangle, , Info, FileText } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { emailDiagnostics } from '@/api/functions';

const StepResult = ({ step }) => {
    const getIcon = () => {
        if (step.success === true) return <CheckCircle className="w-5 h-5 text-green-500" />;
        if (step.success === false) return <AlertTriangle className="w-5 h-5 text-red-500" />;
        return <Info className="w-5 h-5 text-blue-500" />;
    };

    return (
        <div className="p-3 border-b last:border-b-0">
            <div className="flex items-center gap-3">
                {getIcon()}
                <h4 className="font-semibold text-gray-800">{step.name}</h4>
            </div>
            <p className="ml-8 text-sm text-gray-600">{step.message}</p>
            {step.details && (
                <pre className="ml-8 mt-2 text-xs bg-gray-100 p-3 rounded-md whitespace-pre-wrap font-mono">
                    {typeof step.details === 'object' ? JSON.stringify(step.details, null, 2) : step.details}
                </pre>
            )}
        </div>
    );
};

export default function EmailDiagnosticsPanel() {
    const [testEmail, setTestEmail] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [diagnosticsResult, setDiagnosticsResult] = useState(null);

    const handleRunDiagnostics = async () => {
        if (!testEmail) return;

        setIsTesting(true);
        setDiagnosticsResult(null);

        try {
            const { data: result } = await emailDiagnostics({ test_email: testEmail });
            setDiagnosticsResult(result);
        } catch (error) {
            const errorResult = {
                overall_success: false,
                steps: [],
                summary: "Kon de diagnostische functie niet uitvoeren.",
                next_steps: `Er is een onverwachte fout opgetreden: ${error.message}`
            };
            setDiagnosticsResult(errorResult);
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-emerald-600" />
                    E-mail Diagnostiek
                </CardTitle>
                <CardDescription>
                    Voer een volledige systeemcheck uit om e-mailproblemen te diagnosticeren.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        type="email"
                        placeholder="Uw e-mailadres voor de test"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="flex-grow"
                    />
                    <Button onClick={handleRunDiagnostics} disabled={isTesting || !testEmail} className="sm:w-auto">
                        {isTesting ? (
                            <InlineSpinner />
                        ) : (
                            <FileText className="w-4 h-4 mr-2" />
                        )}
                        Start Diagnostiek
                    </Button>
                </div>

                {isTesting && (
                     <div className="text-center py-4">
                        <LoadingSpinner size="default" />
                        <p className="mt-2 text-sm text-gray-500">Diagnostiek wordt uitgevoerd...</p>
                    </div>
                )}

                {diagnosticsResult && (
                    <div className="border rounded-lg mt-6">
                        <div className={`p-4 rounded-t-lg ${diagnosticsResult.overall_success ? 'bg-green-50' : 'bg-red-50'}`}>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {diagnosticsResult.overall_success ? 
                                    <CheckCircle className="text-green-600" /> : 
                                    <AlertTriangle className="text-red-600" />
                                }
                                Diagnostiek Resultaat
                            </h3>
                             <p className="text-sm text-gray-700 mt-1"><strong>Samenvatting:</strong> {diagnosticsResult.summary}</p>
                        </div>
                        <div className="bg-white divide-y">
                           {diagnosticsResult.steps.map((step, index) => (
                               <StepResult key={index} step={step} />
                           ))}
                        </div>
                         <div className="p-4 bg-gray-50 rounded-b-lg">
                            <h4 className="font-semibold text-gray-800">Volgende Stappen</h4>
                            <p className="text-sm text-gray-600 mt-1">{diagnosticsResult.next_steps}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}