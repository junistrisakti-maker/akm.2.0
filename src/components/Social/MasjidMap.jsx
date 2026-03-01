import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Custom icon for user location
const UserIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const RecenterMap = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom || map.getZoom());
        }
    }, [center, zoom, map]);
    return null;
};

const MapEvents = ({ onSelectLocation }) => {
    useMapEvents({
        click(e) {
            if (onSelectLocation) {
                onSelectLocation(e.latlng);
            }
        },
    });
    return null;
};

const MasjidMap = ({
    mosques = [],
    center = [-6.2088, 106.8456],
    zoom = 11,
    onSelectLocation,
    selectedLocation,
    userLocation = null,
    showRadius = true
}) => {
    const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : center;
    const mapZoom = userLocation ? 15 : zoom;

    return (
        <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <RecenterMap center={mapCenter} zoom={mapZoom} />
            <MapEvents onSelectLocation={onSelectLocation} />

            {userLocation && (
                <>
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={UserIcon}>
                        <Popup>Lokasi Anda Sekarang</Popup>
                    </Marker>
                    {showRadius && (
                        <Circle
                            center={[userLocation.lat, userLocation.lng]}
                            radius={500}
                            pathOptions={{
                                color: '#3b82f6',
                                fillColor: '#3b82f6',
                                fillOpacity: 0.15,
                                weight: 2
                            }}
                        />
                    )}
                </>
            )}

            {selectedLocation && (
                <Marker position={selectedLocation}>
                    <Popup>Preview Lokasi Masjid</Popup>
                </Marker>
            )}

            {mosques.filter(m => m.coordinates).map((mosque) => {
                const coords = mosque.coordinates.split(',').map(Number);
                return (
                    <Marker key={mosque.id} position={coords}>
                        <Popup>
                            <div style={{ padding: '4px' }}>
                                <h4 style={{ margin: '0 0 4px 0', color: 'white' }}>{mosque.name}</h4>
                                <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: '#94a3b8' }}>{mosque.address}</p>
                                <Link
                                    to={`/masjid/${mosque.id}`}
                                    style={{
                                        display: 'block',
                                        textAlign: 'center',
                                        padding: '4px 8px',
                                        background: 'var(--accent-primary)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Lihat Detail
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
};

export default MasjidMap;
