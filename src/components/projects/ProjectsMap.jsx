import React, { useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';

// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function ProjectsMap({ projects, onMarkerClick, initialCenter }) {
    const mapRef = useRef(null);
    const validProjects = projects.filter(p => p && p.latitude && p.longitude);

    if (validProjects.length === 0) {
        return (
            <div className="text-center py-10 bg-gray-100 dark:bg-slate-800 rounded-lg">
                <p className="text-gray-600 dark:text-slate-400">Geen projecten met een geldige locatie gevonden.</p>
                <p className="text-sm text-gray-500 mt-2">Zorg ervoor dat projecten een correct adres hebben.</p>
            </div>
        );
    }
    
    // Bepaal center en zoom op basis van initialCenter of fallback naar gemiddelde
    let centerLat, centerLng, zoomLevel;
    
    if (initialCenter && initialCenter.lat && initialCenter.lng) {
        // Gebruik het laatst toegevoegde project als center
        centerLat = initialCenter.lat;
        centerLng = initialCenter.lng;
        zoomLevel = initialCenter.zoom || 13;
    } else {
        // Fallback: bereken gemiddelde van alle projecten
        const latitudes = validProjects.map(p => p.latitude);
        const longitudes = validProjects.map(p => p.longitude);
        centerLat = latitudes.reduce((sum, lat) => sum + lat, 0) / latitudes.length;
        centerLng = longitudes.reduce((sum, lng) => sum + lng, 0) / longitudes.length;
        zoomLevel = 10;
    }

    return (
        <div className="relative">
            <MapContainer 
                ref={mapRef}
                center={[centerLat, centerLng]} 
                zoom={zoomLevel} 
                style={{ height: '600px', width: '100%' }} 
                className="rounded-lg shadow-md"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {validProjects.map(project => {
                    const coverPhoto = project.cover_photo_url || project.thumbnail_url || (project.photo_urls && project.photo_urls[0]);
                    
                    return (
                        <Marker key={project.id} position={[project.latitude, project.longitude]}>
                            <Popup maxWidth={280} className="custom-popup">
                                <div className="relative min-h-[200px] rounded-lg overflow-hidden">
                                    {/* Background Image */}
                                    {coverPhoto ? (
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                            style={{ backgroundImage: `url(${coverPhoto})` }}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600" />
                                    )}
                                    
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    
                                    {/* Content */}
                                    <div className="relative z-10 p-4 h-full flex flex-col justify-end text-white">
                                        <h3 className="font-bold text-lg mb-1 leading-tight">{project.project_name}</h3>
                                        <p className="text-sm text-white/90 mb-1">{project.client_name}</p>
                                        <p className="text-xs text-white/75 mb-4">{project.address}</p>
                                        
                                        <Button 
                                            size="sm" 
                                            className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all"
                                            onClick={() => onMarkerClick(project)}
                                        >
                                            Bekijk Details
                                        </Button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}