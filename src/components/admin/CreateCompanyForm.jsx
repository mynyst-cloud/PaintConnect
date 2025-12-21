
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, PlusCircle, AlertTriangle, Mail, Trash2 } from 'lucide-react';
import LoadingSpinner, { InlineSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { adminCreateCompany } from '@/api/functions';
import { deleteCompany } from '@/api/functions'; // Assuming this function exists for deleting companies
import { resendCompanyInvitation } from '@/api/functions'; // Assuming this function exists for resending invitations

export default function CreateCompanyForm({ onCancel, onCompanyAdded }) {
    const [formData, setFormData] = useState({
        company_name: '',
        contact_person_name: '',
        email: '',
        phone_number: '',
        subscription_plan: 'starter',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [conflictData, setConflictData] = useState(null); // New state to handle conflict scenarios
    const { toast } = useToast();

    const validateForm = () => {
        const newErrors = {};
        if (!formData.company_name.trim()) newErrors.company_name = "Bedrijfsnaam is verplicht.";
        if (!formData.contact_person_name.trim()) newErrors.contact_person_name = "Naam contactpersoon is verplicht.";
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Een geldig e-mailadres is verplicht.";
        if (!formData.subscription_plan) newErrors.subscription_plan = "Abonnement is verplicht.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            // The function now expects the raw payload, not an object with a 'data' property
            const response = await adminCreateCompany(formData);
            
            // Check for explicit error in the response body, even with a 2xx status
            if (response.data?.error) {
                throw new Error(response.data.error);
            }

            toast({
                title: "Bedrijf Aangemaakt",
                description: `Activatiemail is verzonden naar ${formData.email}.`,
            });
            onCompanyAdded();
            // Clear form and conflict state on successful creation
            setFormData({
                company_name: '',
                contact_person_name: '',
                email: '',
                phone_number: '',
                subscription_plan: 'starter',
            });
            setErrors({}); // Clear any previous errors
            setConflictData(null); // Clear conflict data if any was set
        } catch (error) {
            console.error("Error creating company:", error);
            
            const errorData = error.response?.data;
            let errorMessage = errorData?.error || error.message || "Kon bedrijf niet aanmaken. Probeer het opnieuw.";
            
            // Handle conflict situations with existing companies (HTTP 409)
            if (error.response?.status === 409 && errorData?.existing_company_id) {
                let fullConflictDescription = `Er bestaat al een bedrijf met de naam "${formData.company_name}".`;

                if (errorData.existing_company_status) {
                    fullConflictDescription += ` De status van dit bedrijf is "${errorData.existing_company_status}".`;
                }

                // Append any specific error detail from the backend, if it adds value
                // and is not just a generic conflict message.
                if (errorData?.error && errorData.error.toLowerCase() !== "conflict") {
                    fullConflictDescription += ` Detail: ${errorData.error}.`;
                }

                // Add suggested actions based on the status
                if (errorData.existing_company_status === 'pending_activation') {
                    fullConflictDescription += ` U kunt een nieuwe activatie-uitnodiging versturen naar het opgegeven e-mailadres, het bestaande bedrijf verwijderen, of teruggaan om de gegevens te wijzigen.`;
                } else {
                    fullConflictDescription += ` U kunt het bestaande bedrijf verwijderen, of teruggaan om de gegevens te wijzigen.`;
                }

                setConflictData({
                    existing_company_id: errorData.existing_company_id,
                    existing_company_status: errorData.existing_company_status,
                    error_message: fullConflictDescription // This now holds the full, detailed message for AlertDescription
                });
                // Do not show toast here; the conflict resolution UI will take over.
                return; // Exit handleSubmit, keeping setIsSubmitting true to indicate an action is pending.
                        // It will be reset in the finally block.
            }
            
            // Special handling for duplicate company names for other error codes if 409 isn't the only case
            if (errorMessage.includes('already exists')) {
                errorMessage = `${errorMessage}\n\nMogelijke oplossingen:\n• Gebruik een andere bedrijfsnaam\n• Controleer of het bedrijf al bestaat in de bedrijvenlijst\n• Verwijder het bestaande bedrijf eerst als het een testrecord is`;
            }
            
            toast({
                variant: "destructive",
                title: "Fout bij aanmaken",
                description: errorMessage,
                duration: 8000, // Longer duration for detailed error
            });
        } finally {
            setIsSubmitting(false); // Ensure submitting state is always reset
        }
    };

    const handleDeleteExisting = async () => {
        if (!conflictData?.existing_company_id) return;
        
        setIsSubmitting(true); // Indicate deletion is in progress
        try {
            // Call delete function
            await deleteCompany({ companyId: conflictData.existing_company_id });
            
            toast({
                title: "Bedrijf Verwijderd",
                description: "Het bestaande bedrijf is verwijderd. U kunt nu opnieuw proberen.",
            });
            
            setConflictData(null); // Clear conflict data to show the original form again
            // Optionally, reset form data as well if a retry is expected immediately after deletion.
            setFormData(prev => ({ ...prev, company_name: '', email: '' }));
        } catch (error) {
            console.error("Error deleting existing company:", error);
            toast({
                variant: "destructive",
                title: "Fout bij verwijderen",
                description: error.response?.data?.error || error.message || "Kon bestaand bedrijf niet verwijderen.",
            });
        } finally {
            setIsSubmitting(false); // Reset submitting state
        }
    };

    const handleResendInvitation = async () => {
        if (!conflictData?.existing_company_id) return;
        
        setIsSubmitting(true); // Indicate resending is in progress
        try {
            // Call resend invitation function
            await resendCompanyInvitation({ 
                companyId: conflictData.existing_company_id,
                email: formData.email 
            });
            
            toast({
                title: "Uitnodiging Verzonden",
                description: "Een nieuwe activatiemail is verzonden.",
            });
            
            onCompanyAdded(); // Inform parent component that a company action has been completed
            setConflictData(null); // Clear conflict data, presumably closing the form
        } catch (error) {
            console.error("Error resending invitation:", error);
            toast({
                variant: "destructive",
                title: "Fout bij verzenden",
                description: error.response?.data?.error || error.message || "Kon uitnodiging niet verzenden.",
            });
        } finally {
            setIsSubmitting(false); // Reset submitting state
        }
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
        >
            <motion.div
                className="w-full max-w-lg"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                {conflictData ? ( // Conditionally render conflict resolution UI
                    <Card className="shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-orange-700">Bedrijf Bestaat Al</CardTitle>
                            <Button variant="ghost" size="icon" type="button" onClick={() => setConflictData(null)} disabled={isSubmitting}>
                                <X className="w-4 h-4"/>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Conflict Gedetecteerd</AlertTitle>
                                <AlertDescription>
                                    {conflictData.error_message}
                                </AlertDescription>
                            </Alert>
                            
                            <p className="text-sm text-gray-600">
                                Wat wilt u doen?
                            </p>
                            
                            <div className="space-y-2">
                                {conflictData.existing_company_status === 'pending_activation' && (
                                    <Button 
                                        onClick={handleResendInvitation}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <InlineSpinner className="mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                                        Verstuur Nieuwe Uitnodiging
                                    </Button>
                                )}
                                
                                <Button 
                                    onClick={handleDeleteExisting}
                                    variant="destructive"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <InlineSpinner className="mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                    Verwijder Bestaand Bedrijf
                                </Button>
                                
                                <Button 
                                    variant="outline"
                                    onClick={() => setConflictData(null)} // Go back to the form
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    Terug naar Formulier
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : ( // Original form for creating a new company
                    <form onSubmit={handleSubmit}>
                        <Card className="shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Nieuw Bedrijf Aanmaken</CardTitle>
                                <Button variant="ghost" size="icon" type="button" onClick={onCancel}>
                                    <X className="w-4 h-4"/>
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="company_name">Bedrijfsnaam *</Label>
                                        <Input id="company_name" value={formData.company_name} onChange={(e) => handleChange('company_name', e.target.value)} />
                                        {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="contact_person_name">Contactpersoon *</Label>
                                        <Input id="contact_person_name" value={formData.contact_person_name} onChange={(e) => handleChange('contact_person_name', e.target.value)} />
                                        {errors.contact_person_name && <p className="text-red-500 text-sm mt-1">{errors.contact_person_name}</p>}
                                    </div>
                                </div>
                                
                                <div>
                                    <Label htmlFor="email">E-mail (Admin) *</Label>
                                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="phone_number">Telefoonnummer (Optioneel)</Label>
                                    <Input id="phone_number" value={formData.phone_number} onChange={(e) => handleChange('phone_number', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="subscription_plan">Abonnement *</Label>
                                    <Select value={formData.subscription_plan} onValueChange={(value) => handleChange('subscription_plan', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kies een abonnement" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="starter">Starter (€29/maand)</SelectItem>
                                            <SelectItem value="professional">Professional (€79/maand)</SelectItem>
                                            <SelectItem value="enterprise">Enterprise (€199/maand)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.subscription_plan && <p className="text-red-500 text-sm mt-1">{errors.subscription_plan}</p>}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                                    Annuleren
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                                    {isSubmitting ? <InlineSpinner className="mr-2" /> : <PlusCircle className="mr-2 w-4 h-4" />}
                                    Bedrijf Opslaan & Uitnodigen
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                )}
            </motion.div>
        </motion.div>
    );
}
