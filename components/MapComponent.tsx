import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import * as L from 'leaflet';
import { SearchIcon, CrosshairIcon, LayersIcon } from './Icons';

// Fix for default marker icon not appearing in some bundlers
const icon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

// Use a function to create the icon on demand, avoiding module-level execution issues
const createDefaultIcon = () => {
    return L.icon({
        iconUrl: icon,
        shadowUrl: iconShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
    });
};

interface MapControllerProps {
    onBoundsChange?: (bounds: L.LatLngBounds) => void;
    onClick?: (coords: L.LatLng) => void;
}

const MapController: React.FC<MapControllerProps> = ({ onBoundsChange, onClick }) => {
    const map = useMap();
    const [isLocating, setIsLocating] = useState(false);

    useMapEvents({
        dragend: () => {
            if (onBoundsChange) {
                onBoundsChange(map.getBounds());
            }
        },
        zoomend: () => {
            if (onBoundsChange) {
                onBoundsChange(map.getBounds());
            }
        },
        click: (e) => onClick && onClick(e.latlng),
    });
    
    const handleCenterOnLocation = () => {
        setIsLocating(true);
        map.locate().on('locationfound', (e) => {
            map.flyTo(e.latlng, map.getZoom());
            setIsLocating(false);
        }).on('locationerror', (e) => {
            alert('Could not find your location. Please check browser permissions.');
            setIsLocating(false);
        });
    };

    return (
        <div className="absolute bottom-4 right-4 z-[1000]">
            <button
                onClick={handleCenterOnLocation}
                disabled={isLocating}
                title="Center on my location"
                className="bg-white hover:bg-gray-100 text-neutral-800 font-bold p-3 rounded-full shadow-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
                {isLocating ? (
                     <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <CrosshairIcon className="w-5 h-5" />
                )}
            </button>
        </div>
    );
};

const ChangeView: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom);
    }, [center, zoom, map]);
    return null;
}

interface MapMarker {
    id: string;
    position: [number, number];
    content: React.ReactNode;
    icon?: L.Icon | L.DivIcon;
    draggable?: boolean;
    onDragEnd?: (coords: L.LatLng) => void;
}

interface MapComponentProps {
    markers: MapMarker[];
    center: [number, number];
    zoom: number;
    className?: string;
    onBoundsChange?: (bounds: L.LatLngBounds) => void;
    onClick?: (coords: L.LatLng) => void;
    onMarkerClick?: (id: string) => void;
    polylinePositions?: [number, number][];
    selectedMarkerIds?: string[];
}

const MapComponent: React.FC<MapComponentProps> = ({ markers, center, zoom, className, onBoundsChange, onClick, onMarkerClick, polylinePositions, selectedMarkerIds }) => {
    const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

    const tileLayers = {
        street: {
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
    };
    
    return (
        <div className={`relative ${className}`}>
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
                <ChangeView center={center} zoom={zoom} />
                <TileLayer
                    key={mapType}
                    attribution={tileLayers[mapType].attribution}
                    url={tileLayers[mapType].url}
                />
                {markers.map((marker) => {
                    const isSelected = selectedMarkerIds?.includes(marker.id);
                    let finalIcon = marker.icon;

                    if (isSelected && marker.icon instanceof L.DivIcon) {
                        const originalHtml = marker.icon.options.html || '';
                        finalIcon = L.divIcon({
                            ...marker.icon.options,
                            html: `<div class="relative">${originalHtml}<div class="absolute -inset-1 rounded-full ring-2 ring-offset-2 ring-primary animate-pulse"></div></div>`,
                        });
                    }
                    
                    return (
                        <Marker 
                            key={marker.id}
                            position={marker.position}
                            icon={finalIcon || createDefaultIcon()}
                            draggable={marker.draggable}
                            eventHandlers={{
                                click: () => {
                                    if (onMarkerClick) {
                                        onMarkerClick(marker.id);
                                    }
                                },
                                dragend: (event) => {
                                    if (marker.onDragEnd) {
                                        marker.onDragEnd(event.target.getLatLng());
                                    }
                                },
                            }}
                        >
                            <Popup>
                                {marker.content}
                            </Popup>
                        </Marker>
                    )
                })}
                 {polylinePositions && (
                    <Polyline
                        positions={polylinePositions as L.LatLngExpression[]}
                        pathOptions={{ color: '#1976D2', weight: 4, opacity: 0.8, dashArray: '5, 10' }}
                    />
                )}
                <MapController onBoundsChange={onBoundsChange} onClick={onClick} />
            </MapContainer>
             <div className="absolute bottom-4 left-4 z-[1000]">
                <button
                    onClick={() => setMapType(prev => prev === 'street' ? 'satellite' : 'street')}
                    title="Change map style"
                    className="bg-white hover:bg-gray-100 text-neutral-800 font-bold p-3 rounded-full shadow-lg flex items-center justify-center transition-colors"
                >
                    <LayersIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default MapComponent;