import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Palette, 
    Edit, 
    Trash2, 
    FileText, 
    Image as ImageIcon, 
    Download, 
    Loader2,
    Eye,
    ExternalLink,
    MoreVertical
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { base44 } from '@/api/base44Client';
import PDFViewer from '@/components/common/PDFViewer';
import { motion } from 'framer-motion';

export default function ColorAdviceCard({ advice, onEdit, onDelete, isAdmin }) {
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);

    const getSignedUrl = async (fileUrl) => {
        if (!fileUrl) return null;
        
        if (fileUrl.includes('/private/')) {
            try {
                const result = await base44.integrations.Core.CreateFileSignedUrl({
                    file_uri: fileUrl,
                    expires_in: 300
                });
                return result?.signed_url || null;
            } catch (error) {
                console.error('Error creating signed URL:', error);
                return null;
            }
        }
        return fileUrl;
    };

    const handleViewPdf = () => {
        if (!advice.advice_pdf_url) return;
        setShowPdfViewer(true);
    };

    const handleDownloadPdf = async () => {
        if (!advice.advice_pdf_url) return;
        
        setIsLoadingPdf(true);
        try {
            const signedUrl = await getSignedUrl(advice.advice_pdf_url);
            if (signedUrl) {
                window.open(signedUrl, '_blank');
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
        } finally {
            setIsLoadingPdf(false);
        }
    };

    if (!advice) {
        console.warn('ColorAdviceCard: No advice prop provided');
        return null;
    }

    const statusConfig = {
        concept: { 
            label: 'Concept', 
            className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
        },
        definitief: { 
            label: 'Definitief', 
            className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
        },
        goedgekeurd_klant: { 
            label: 'Goedgekeurd', 
            className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
        }
    };

    const status = statusConfig[advice.status] || statusConfig.concept;
    const hasPdf = !!advice.advice_pdf_url;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-200"
        >
            {/* Color Preview Header */}
            <div className="relative h-24 flex items-center justify-center" style={{ backgroundColor: advice.color_hex || '#F3F4F6' }}>
                {/* Overlay gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                {/* Status Badge */}
                <Badge 
                    variant="outline" 
                    className={`absolute top-3 left-3 ${status.className} border text-xs font-medium`}
                >
                    {status.label}
                </Badge>

                {/* Actions Menu */}
                {isAdmin && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-sm z-10"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 z-[99999]" style={{ zIndex: 99999 }}>
                            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                                <Edit className="w-4 h-4 mr-2" />
                                Bewerken
                            </DropdownMenuItem>
                            {hasPdf && (
                                <>
                                    <DropdownMenuItem onClick={handleViewPdf} className="cursor-pointer">
                                        <Eye className="w-4 h-4 mr-2" />
                                        Bekijk PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDownloadPdf} className="cursor-pointer">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download PDF
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={onDelete} 
                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Verwijderen
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Color Code Display */}
                <div className="relative z-10 text-center">
                    <p className="text-lg font-bold text-white drop-shadow-md">
                        {advice.color_code || 'Geen code'}
                    </p>
                    <p className="text-xs text-white/90 drop-shadow">
                        {advice.color_type}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Room Name & Brand */}
                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Palette className="w-4 h-4 text-emerald-600" />
                        {advice.room_name || 'Naamloze ruimte'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {advice.paint_brand}{advice.paint_name ? ` • ${advice.paint_name}` : ''}
                    </p>
                </div>

                {/* Notes */}
                {advice.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                        {advice.notes}
                    </p>
                )}

                {/* Photos indicator */}
                {advice.photo_urls && advice.photo_urls.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{advice.photo_urls.length} foto{advice.photo_urls.length !== 1 ? "'s" : ''}</span>
                    </div>
                )}

                {/* PDF Actions */}
                {hasPdf && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={handleViewPdf}
                        >
                            <Eye className="w-4 h-4 mr-1.5" />
                            Bekijken
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={handleDownloadPdf}
                            disabled={isLoadingPdf}
                        >
                            {isLoadingPdf ? (
                                <InlineSpinner />
                            ) : (
                                <Download className="w-4 h-4 mr-1.5" />
                            )}
                            Download
                        </Button>
                    </div>
                )}
            </div>

            <PDFViewer
                isOpen={showPdfViewer}
                onClose={() => setShowPdfViewer(false)}
                pdfUrl={advice.advice_pdf_url}
                title={`Kleuradvies: ${advice.room_name}`}
                allowDownload={true}
            />
        </motion.div>
    );
}