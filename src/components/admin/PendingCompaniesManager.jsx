import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    CheckCircle, XCircle, Clock, Building, Mail, Phone, 
    AlertTriangle, Eye, UserPlus, Loader2, Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { PendingCompany } from '@/api/entities';
import { approveCompany } from '@/api/functions';

const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200"
};

const statusLabels = {
    pending: "In behandeling",
    approved: "Goedgekeurd", 
    rejected: "Afgewezen"
};

export default function PendingCompaniesManager({ pendingCompanies = [], onRefresh }) {
    const [processingIds, setProcessingIds] = useState(new Set());

    const handleApprove = async (pendingCompany) => {
        if (processingIds.has(pendingCompany.id)) return;
        
        setProcessingIds(prev => new Set([...prev, pendingCompany.id]));
        
        try {
            console.log('Calling backend to approve company:', pendingCompany.company_name);
            
            const { data } = await approveCompany({ 
                pendingCompanyId: pendingCompany.id 
            });
            
            console.log('Approval successful:', data);
            alert(`Bedrijf '${pendingCompany.company_name}' is succesvol goedgekeurd!`);
            
            // Refresh the data
            if (onRefresh) onRefresh();
            
        } catch (error) {
            console.error('Approval failed:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Onbekende fout';
            alert(`Goedkeuring mislukt: ${errorMessage}`);
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(pendingCompany.id);
                return newSet;
            });
        }
    };

    const handleReject = async (pendingCompany) => {
        if (processingIds.has(pendingCompany.id)) return;
        
        if (!confirm(`Weet u zeker dat u de registratie van ${pendingCompany.company_name} wilt afwijzen?`)) {
            return;
        }
        
        setProcessingIds(prev => new Set([...prev, pendingCompany.id]));
        
        try {
            await PendingCompany.update(pendingCompany.id, { 
                status: 'rejected' 
            });
            alert(`Registratie van '${pendingCompany.company_name}' is afgewezen.`);
        } catch (error) {
            console.error('Rejection failed:', error);
            alert('Er is een fout opgetreden bij het afwijzen van de registratie.');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(pendingCompany.id);
                return newSet;
            });
            if (onRefresh) onRefresh();
        }
    };

    const handleDelete = async (pendingCompany) => {
        if (processingIds.has(pendingCompany.id)) return;
        if (!confirm(`Weet u zeker dat u de aanvraag van ${pendingCompany.company_name} permanent wilt verwijderen?`)) {
            return;
        }

        setProcessingIds(prev => new Set([...prev, pendingCompany.id]));
        try {
            await PendingCompany.delete(pendingCompany.id);
            alert(`Aanvraag van '${pendingCompany.company_name}' is verwijderd.`);
        } catch(error) {
            console.error("Delete failed:", error);
            alert('Kon de aanvraag niet verwijderen.');
        } finally {
             setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(pendingCompany.id);
                return newSet;
            });
            if (onRefresh) onRefresh();
        }
    };

    const handleResendInvitation = async (pendingCompany) => {
        if (processingIds.has(pendingCompany.id)) return;
        
        setProcessingIds(prev => new Set([...prev, pendingCompany.id]));
        
        try {
            // Send reminder email via Base44
            const emailSubject = 'Herinnering: PaintConnect Account Status';
            const emailBody = `
                <h2>Update over uw PaintConnect registratie</h2>
                <p>Beste ${pendingCompany.company_name},</p>
                <p>Uw registratie bij PaintConnect wordt momenteel beoordeeld door ons team.</p>
                <p>U ontvangt een nieuwe e-mail zodra uw account is goedgekeurd.</p>
                <p>Heeft u vragen? Neem contact op via support@paintconnect.be</p>
            `;

            await fetch('https://base44.app/api/integrations/Core/SendEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-Id': Deno.env.get('BASE44_APP_ID')
                },
                body: JSON.stringify({
                    to: pendingCompany.email,
                    subject: emailSubject,
                    body: emailBody,
                    from_name: 'PaintConnect Support'
                })
            });

            alert(`Herinneringsmail verzonden naar ${pendingCompany.email}`);
        } catch (error) {
            console.error('Email sending failed:', error);
            alert('Er is een fout opgetreden bij het versturen van de herinnering.');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(pendingCompany.id);
                return newSet;
            });
        }
    };
    
    const pendingOnly = (pendingCompanies || []).filter(c => c.status === 'pending');
    const processedCompanies = (pendingCompanies || []).filter(c => c.status !== 'pending');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Bedrijfsregistraties</h2>
                    <p className="text-gray-600">Beheer nieuwe registratie-aanvragen</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        {pendingOnly.length} wachtend
                    </Badge>
                    {processedCompanies.length > 0 && (
                        <Badge variant="outline" className="text-gray-600">
                            {processedCompanies.length} verwerkt
                        </Badge>
                    )}
                </div>
            </div>

            {/* Pending Companies */}
            {pendingOnly.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-500" />
                        Wachtend op goedkeuring ({pendingOnly.length})
                    </h3>
                    
                    <div className="grid gap-4">
                        {pendingOnly.map((company) => (
                            <motion.div
                                key={company.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-yellow-200 rounded-lg p-6"
                            >
                                <div className="flex justify-between items-start flex-wrap gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Building className="w-6 h-6 text-gray-600" />
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900">
                                                    {company.company_name}
                                                </h4>
                                                <Badge className={statusColors[company.status]}>
                                                    {statusLabels[company.status]}
                                                </Badge>
                                            </div>
                                        </div>
                                        
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">E-mail:</span>
                                                <span>{company.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Building className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">BTW:</span>
                                                <span>{company.vat_number}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <UserPlus className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">Schilders:</span>
                                                <span>{company.number_of_painters || 1}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">Aangevraagd:</span>
                                                <span>
                                                    {format(new Date(company.created_date), 'dd MMM yyyy HH:mm', { locale: nl })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            onClick={() => handleApprove(company)}
                                            disabled={processingIds.has(company.id)}
                                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                        >
                                            {processingIds.has(company.id) ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4" />
                                            )}
                                            Goedkeuren
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(company)}
                                            disabled={processingIds.has(company.id)}
                                            variant="outline"
                                            className="border-gray-300 text-gray-700 hover:bg-gray-100 gap-2"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Afwijzen
                                        </Button>
                                        <Button
                                            onClick={() => handleResendInvitation(company)}
                                            disabled={processingIds.has(company.id)}
                                            variant="outline"
                                            className="border-blue-500 text-blue-700 hover:bg-blue-50 gap-2"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Herinnering
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(company)}
                                            disabled={processingIds.has(company.id)}
                                            variant="destructive"
                                            className="gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center text-gray-500">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen nieuwe aanvragen</h3>
                        <p>Er zijn momenteel geen bedrijfsregistraties die wachten op goedkeuring.</p>
                    </CardContent>
                </Card>
            )}

            {/* Processed Companies */}
            {processedCompanies.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Eye className="w-5 h-5 text-gray-500" />
                        Recent verwerkt ({processedCompanies.length})
                    </h3>
                    
                    <div className="grid gap-3">
                        {processedCompanies.slice(0, 10).map((company) => (
                            <div 
                                key={company.id}
                                className="bg-gray-50 border rounded-lg p-4 flex justify-between items-center"
                            >
                                <div className="flex items-center gap-3">
                                    <Building className="w-5 h-5 text-gray-500" />
                                    <div>
                                        <span className="font-medium">{company.company_name}</span>
                                        <span className="text-sm text-gray-500 ml-2">({company.email})</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge className={statusColors[company.status]} variant="outline">
                                        {statusLabels[company.status]}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                        {format(new Date(company.updated_date || company.created_date), 'dd MMM', { locale: nl })}
                                    </span>
                                    <Button
                                        onClick={() => handleDelete(company)}
                                        disabled={processingIds.has(company.id)}
                                        variant="destructive"
                                        size="sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}