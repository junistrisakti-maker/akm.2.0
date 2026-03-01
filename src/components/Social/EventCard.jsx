import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';

const EventCard = ({ event, onJoin, isJoined }) => {
    return (
        <div className="glass-panel" style={{
            overflow: 'hidden',
            borderRadius: '16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)'
        }}>
            <div style={{ position: 'relative', height: '140px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: event.color || '#334155' }}>
                    {event.image ? (
                        <img src={event.image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', fontWeight: 'bold' }}>
                            {event.title}
                        </div>
                    )}
                </div>
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'var(--accent-primary)',
                    backdropFilter: 'blur(4px)',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    color: 'white',
                    zIndex: 2
                }}>
                    {event.category || 'Event'}
                </div>
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: '#fbbf24'
                }}>
                    Mendatang
                </div>
            </div>

            <div style={{ padding: '16px' }}>
                <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>{event.title}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} />
                        <span>{event.date} • {event.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} color="var(--accent-secondary)" />
                        <span style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>{event.mosque_name || event.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={14} />
                        <span>{event.attendees_count} Jemaah bergabung</span>
                    </div>
                </div>

                <button
                    onClick={() => onJoin(event.id)}
                    disabled={isJoined}
                    style={{
                        width: '100%',
                        marginTop: '16px',
                        padding: '10px',
                        borderRadius: '8px',
                        background: isJoined ? 'var(--bg-secondary)' : 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                        color: isJoined ? 'var(--text-secondary)' : 'white',
                        fontWeight: '600',
                        border: isJoined ? '1px solid var(--glass-border)' : 'none',
                        cursor: isJoined ? 'default' : 'pointer',
                        boxShadow: isJoined ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)'
                    }}
                >
                    {isJoined ? 'Sudah Ikut ✓' : 'Ikuti Kegiatan'}
                </button>
            </div>
        </div>
    );
};

export default EventCard;
