import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, Info, Users, MapPin, Calendar, CheckSquare } from 'lucide-react';
import { formatDate } from '@/components/utils';

const statusOptions = [
    { value: "niet_gestart", label: "Niet gestart" },
    { value: "in_uitvoering", label: "In uitvoering" },
    { value: "bijna_klaar", label: "Bijna klaar" },
    { value: "afgerond", label: "Afgerond" }
];

export default function ProjectInfoPanel({ project, onProjectUpdate, isAdmin }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProject, setEditedProject] = useState(project);

    const handleInputChange = (field, value) => {
        setEditedProject(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        const changes = Object.keys(editedProject).reduce((acc, key) => {
            if (editedProject[key] !== project[key]) {
                acc[key] = editedProject[key];
            }
            return acc;
        }, {});
        
        if (Object.keys(changes).length > 0) {
            await onProjectUpdate(changes);
        }
        setIsEditing(false);
    };

    const InfoRow = ({ icon: Icon, label, value, children }) => (
        <div className="flex items-start py-4">
            <Icon className="w-5 h-5 text-gray-500 mt-1 mr-4 shrink-0" />
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                {children || <p className="text-base text-gray-900 dark:text-slate-200 font-semibold">{value || 'Niet opgegeven'}</p>}
            </div>
        </div>
    );

    if (isEditing && isAdmin) {
        // --- Edit Mode ---
        return (
            <Card className="p-4 sm:p-6">
                <CardHeader className="p-0 mb-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl"><Info className="w-5 h-5 text-emerald-600" /> Projectinformatie Bewerken</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}><X className="w-4 h-4 mr-2" /> Annuleren</Button>
                            <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Opslaan</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <div>
                        <Label htmlFor="project_name">Projectnaam</Label>
                        <Input id="project_name" value={editedProject.project_name} onChange={(e) => handleInputChange('project_name', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="client_name">Klantnaam</Label>
                        <Input id="client_name" value={editedProject.client_name} onChange={(e) => handleInputChange('client_name', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="address">Adres</Label>
                        <Input id="address" value={editedProject.address} onChange={(e) => handleInputChange('address', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={editedProject.status} onValueChange={(value) => handleInputChange('status', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="start_date">Startdatum</Label>
                            <Input id="start_date" type="date" value={editedProject.start_date || ''} onChange={(e) => handleInputChange('start_date', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="expected_end_date">Einddatum</Label>
                            <Input id="expected_end_date" type="date" value={editedProject.expected_end_date || ''} onChange={(e) => handleInputChange('expected_end_date', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="description">Beschrijving</Label>
                        <Textarea id="description" value={editedProject.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // --- View Mode (Geen bewerken knop meer) ---
    return (
        <div className="p-2 sm:p-4">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="p-2">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Info className="w-5 h-5 text-emerald-600" /> 
                        Projectinformatie
                    </CardTitle>
                    <CardDescription className="pt-2">{project.description || 'Geen beschrijving beschikbaar.'}</CardDescription>
                </CardHeader>
                <CardContent className="p-2 divide-y dark:divide-slate-700">
                    <InfoRow icon={Users} label="Klant" value={project.client_name} />
                    <InfoRow icon={MapPin} label="Adres" value={project.address} />
                    <InfoRow icon={Calendar} label="Looptijd">
                        <p className="text-base text-gray-900 dark:text-slate-200 font-semibold">
                            {formatDate(project.start_date)} - {formatDate(project.expected_end_date)}
                        </p>
                    </InfoRow>
                    <InfoRow icon={CheckSquare} label="Status">
                         <span className="px-2.5 py-1 text-sm font-semibold leading-none rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                           {statusOptions.find(s => s.value === project.status)?.label || project.status}
                         </span>
                    </InfoRow>
                </CardContent>
            </Card>
        </div>
    );
}