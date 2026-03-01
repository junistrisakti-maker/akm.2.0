import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Camera, Save, Info, Image, Trash2 } from 'lucide-react';
import MasjidMap from './MasjidMap';

const AddMasjidModal = ({ isOpen, onClose, onAdd }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        description: '',
        coordinates: '',
        image: ''
    });
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleMapClick = (latlng) => {
        setSelectedLocation(latlng);
        setFormData(prev => ({ ...prev, coordinates: `${latlng.lat},${latlng.lng}` }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);

        // Upload to server
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch('http://localhost/AKM.2.0/api/upload.php', {
                method: 'POST',
                body: fd
            });
            const data = await res.json();
            if (data.url) {
                setFormData(prev => ({ ...prev, image: data.url }));
            } else {
                alert(data.error || 'Gagal upload gambar');
                setImagePreview(null);
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Gagal upload gambar');
            setImagePreview(null);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setFormData(prev => ({ ...prev, image: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.address || !formData.coordinates) {
            alert("Harap isi Nama, Alamat, dan pilih Lokasi di peta!");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('http://localhost/AKM.2.0/api/mosques.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', ...formData })
            });
            const data = await res.json();
            if (res.ok) {
                onAdd(data);
                onClose();
                resetForm();
            } else {
                alert(data.error || "Gagal menambahkan masjid");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', address: '', description: '', coordinates: '', image: '' });
        setSelectedLocation(null);
        setImagePreview(null);
        setStep(1);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!isOpen) return null;

    const inputStyle = {
        width: '100%',
        padding: '14px',
        borderRadius: '16px',
        background: 'var(--subtle-bg)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-primary)',
        outline: 'none',
        fontFamily: 'inherit',
        fontSize: '0.9rem'
    };

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '480px',
                height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.8)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'flex-end'
            }}>
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-primary)',
                        borderTopLeftRadius: '32px',
                        borderTopRightRadius: '32px',
                        padding: '24px',
                        paddingBottom: '40px',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>Tambah Masjid Baru</h2>
                        <button onClick={() => { onClose(); resetForm(); }} style={{ padding: '8px', background: 'var(--subtle-bg)', borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
                            <X size={20} color="var(--text-secondary)" />
                        </button>
                    </div>

                    {/* Stepper */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        <div style={{ flex: 1, height: '4px', background: step >= 1 ? 'var(--accent-primary)' : 'var(--subtle-bg)', borderRadius: '2px' }}></div>
                        <div style={{ flex: 1, height: '4px', background: step >= 2 ? 'var(--accent-primary)' : 'var(--subtle-bg)', borderRadius: '2px' }}></div>
                    </div>

                    {step === 1 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Image Upload */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Foto Masjid</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                {imagePreview ? (
                                    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                                        />
                                        {uploading && (
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: 'rgba(0,0,0,0.5)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontSize: '0.85rem', fontWeight: 'bold'
                                            }}>
                                                Uploading...
                                            </div>
                                        )}
                                        {!uploading && (
                                            <button
                                                onClick={removeImage}
                                                style={{
                                                    position: 'absolute', top: '8px', right: '8px',
                                                    background: 'rgba(239, 68, 68, 0.9)',
                                                    border: 'none', borderRadius: '50%',
                                                    width: '32px', height: '32px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 size={14} color="white" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            width: '100%',
                                            height: '140px',
                                            borderRadius: '16px',
                                            background: 'var(--subtle-bg)',
                                            border: '2px dashed var(--glass-border)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            color: 'var(--text-secondary)'
                                        }}
                                    >
                                        <Camera size={28} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Tambah Foto</span>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>JPG, PNG, WEBP</span>
                                    </motion.button>
                                )}
                            </div>

                            {/* Name */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nama Masjid *</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Masjid Al-Ikhlas"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Address */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Alamat *</label>
                                <input
                                    type="text"
                                    placeholder="Alamat lengkap"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Deskripsi</label>
                                <textarea
                                    placeholder="Ceritakan tentang masjid ini..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{ ...inputStyle, height: '100px', resize: 'none' }}
                                />
                            </div>

                            {/* Next button */}
                            <button
                                onClick={() => setStep(2)}
                                disabled={!formData.name || !formData.address}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '16px',
                                    background: (formData.name && formData.address) ? 'var(--accent-primary)' : 'var(--subtle-bg)',
                                    color: (formData.name && formData.address) ? 'white' : 'var(--text-secondary)',
                                    fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    border: 'none', cursor: (formData.name && formData.address) ? 'pointer' : 'not-allowed',
                                    fontSize: '0.95rem'
                                }}
                            >
                                Lanjut: Pilih Lokasi <MapPin size={18} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Summary from step 1 */}
                            <div style={{
                                display: 'flex', gap: '12px', padding: '12px',
                                background: 'var(--subtle-bg)', borderRadius: '16px',
                                border: '1px solid var(--glass-border)'
                            }}>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Image size={20} color="var(--text-secondary)" />
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formData.name}</h4>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formData.address}</p>
                                </div>
                            </div>

                            {/* Map */}
                            <div style={{ height: '300px', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative' }}>
                                <MasjidMap
                                    onSelectLocation={handleMapClick}
                                    selectedLocation={selectedLocation}
                                    userLocation={userLocation}
                                    showRadius={true}
                                    zoom={15}
                                />
                                <div style={{
                                    position: 'absolute', top: '12px', left: '12px', right: '12px',
                                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                                    padding: '10px', borderRadius: '12px', zIndex: 1000,
                                    pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <Info size={16} color="var(--accent-secondary)" />
                                    <span style={{ fontSize: '0.75rem', color: 'white' }}>Tap di peta untuk menentukan lokasi masjid</span>
                                </div>
                            </div>

                            {/* Selected coordinates */}
                            {selectedLocation && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                                    <MapPin size={14} color="var(--accent-secondary)" />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: '600' }}>
                                        {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                                    </span>
                                </div>
                            )}

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setStep(1)}
                                    style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--subtle-bg)', color: 'var(--text-primary)', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    Kembali
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !selectedLocation}
                                    style={{
                                        flex: 2, padding: '16px', borderRadius: '16px',
                                        background: selectedLocation ? 'var(--accent-primary)' : 'var(--subtle-bg)',
                                        color: selectedLocation ? 'white' : 'var(--text-secondary)',
                                        fontWeight: 'bold', opacity: loading ? 0.7 : 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        border: 'none', cursor: selectedLocation ? 'pointer' : 'not-allowed',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {loading ? 'Menyimpan...' : 'Daftarkan Masjid'} <Save size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddMasjidModal;
