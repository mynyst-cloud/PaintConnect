import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, ExternalLink, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function InvoiceTable({ invoices }) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState('all');

    // Extract unique years from invoices
    const years = [...new Set(invoices.map(inv => new Date(inv.invoice_date).getFullYear()))].sort((a, b) => b - a);

    // Filter invoices
    const filteredInvoices = invoices.filter(invoice => {
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        const matchesYear = yearFilter === 'all' || new Date(invoice.invoice_date).getFullYear().toString() === yearFilter;
        return matchesStatus && matchesYear;
    });

    const getStatusBadge = (status) => {
        const variants = {
            paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            open: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
            void: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            uncollectible: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        };

        const labels = {
            paid: 'Betaald',
            open: 'Openstaand',
            void: 'Geannuleerd',
            uncollectible: 'Mislukt',
            draft: 'Concept'
        };

        return (
            <Badge className={variants[status] || variants.draft}>
                {labels[status] || status}
            </Badge>
        );
    };

    const handleDownload = (invoice) => {
        // CRITICAL: Check multiple URL fields for maximum compatibility
        const downloadUrl = invoice.pdf_url || invoice.hosted_invoice_url;
        
        if (downloadUrl) {
            console.log(`Opening invoice ${invoice.invoice_number} with URL:`, downloadUrl);
            window.open(downloadUrl, '_blank');
        } else {
            console.error(`No download URL found for invoice ${invoice.invoice_number}:`, invoice);
            alert('Deze factuur heeft geen downloadbare URL. Neem contact op met support.');
        }
    };

    // IMPROVED: Check if invoice has ANY downloadable URL
    const isDownloadable = (invoice) => {
        // Must be paid AND have at least one valid URL
        if (invoice.status !== 'paid') {
            return false;
        }
        
        const hasUrl = !!(invoice.pdf_url || invoice.hosted_invoice_url);
        
        // Debug logging
        if (!hasUrl) {
            console.warn(`Invoice ${invoice.invoice_number} is paid but has no download URL:`, {
                pdf_url: invoice.pdf_url,
                hosted_invoice_url: invoice.hosted_invoice_url,
                payment_provider: invoice.payment_provider
            });
        }
        
        return hasUrl;
    };

    return (
        <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-300">
                    Facturen worden automatisch verstuurd naar uw e-mail (noreply@notifications.paintconnect.be). 
                    U vindt hier ook een overzicht en kunt facturen downloaden.
                </AlertDescription>
            </Alert>

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle statussen</SelectItem>
                            <SelectItem value="paid">Betaald</SelectItem>
                            <SelectItem value="open">Openstaand</SelectItem>
                            <SelectItem value="void">Geannuleerd</SelectItem>
                            <SelectItem value="uncollectible">Mislukt</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder="Jaar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle jaren</SelectItem>
                        {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Factuurnummer</TableHead>
                            <TableHead>Factuurdatum</TableHead>
                            <TableHead>Bedrag</TableHead>
                            <TableHead>Betaalmethode</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Acties</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    Geen facturen gevonden
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                    <TableCell>
                                        {format(new Date(invoice.invoice_date), 'dd-MM-yyyy', { locale: nl })}
                                    </TableCell>
                                    <TableCell>€{(invoice.amount_due || invoice.amount || 0).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {invoice.payment_provider === 'stripe' && (
                                                <span className="text-blue-600 dark:text-blue-400 font-medium">Stripe</span>
                                            )}
                                            {invoice.payment_provider === 'mollie' && (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Mollie</span>
                                            )}
                                            {invoice.payment_method && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">({invoice.payment_method})</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                    <TableCell className="text-right">
                                        {isDownloadable(invoice) ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownload(invoice)}
                                                className="gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download PDF
                                                <ExternalLink className="w-3 h-3" />
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                {invoice.status === 'paid' ? 'PDF wordt gegenereerd...' : 'Niet beschikbaar'}
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}