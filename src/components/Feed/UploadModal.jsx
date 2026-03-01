import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Check, Plus, Trash2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import styles from './UploadModal.module.css';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [audioName, setAudioName] = useState('');
    const [caption, setCaption] = useState('');
    const [location, setLocation] = useState('');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const [uploadStatus, setUploadStatus] = useState('');
    const fileInputRef = useRef();

    const VIBE_GUARD_KEYWORDS = [
        'anjing', 'babi', 'monyet', 'tolol', 'goblok', 'bangsat', 'kontol', 'memek', // Profanity
        'kafir', 'sesat', 'cina', 'pki', 'teroris', 'radikal', // SARA/Provocative
        'porn', 'bokep', 'telanjang', 'bugil' // NSFW
    ];

    const [musicSuggestions, setMusicSuggestions] = useState([]);

    React.useEffect(() => {
        const fetchBacksound = async () => {
            try {
                const response = await fetch('http://localhost/AKM.2.0/api/get_backsound.php');
                const data = await response.json();
                if (data.success && data.list && data.list.length > 0) {
                    const adminVibes = data.list.map(item => ({
                        name: item.name,
                        url: item.url
                    }));

                    setMusicSuggestions(adminVibes);

                    // Set first active as default if empty
                    if (!audioName && data.list.length > 0) {
                        const activeItem = data.list.find(l => l.url === data.url) || data.list[0];
                        setAudioName(activeItem.name);
                    }
                }
            } catch (error) {
                console.error('Error fetching backsound:', error);
            }
        };

        if (isOpen) {
            fetchBacksound();
        }
    }, [isOpen]);

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files);
        const newErrors = [];
        const validFiles = [];
        const maxFiles = 10;
        const maxSize = 50 * 1024 * 1024; // 50MB

        // Check total file count
        if (files.length + selectedFiles.length > maxFiles) {
            newErrors.push(`Maximum ${maxFiles} files allowed`);
            return;
        }

        selectedFiles.forEach(file => {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
            if (!allowedTypes.includes(file.type)) {
                newErrors.push(`${file.name}: File type not allowed`);
                return;
            }

            // Validate file size
            if (file.size > maxSize) {
                newErrors.push(`${file.name}: File too large (max 50MB)`);
                return;
            }

            validFiles.push({
                file,
                id: Math.random().toString(36).substr(2, 9),
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
                type: file.type.startsWith('image/') ? 'image' : 'video',
                name: file.name,
                size: file.size
            });
        });

        setErrors(newErrors);
        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (fileId) => {
        setFiles(prev => {
            const fileToRemove = prev.find(f => f.id === fileId);
            if (fileToRemove?.preview) {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return prev.filter(f => f.id !== fileId);
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateContent = (text) => {
        const lowerText = text.toLowerCase();
        return !VIBE_GUARD_KEYWORDS.some(word => lowerText.includes(word));
    };

    const handleUpload = async () => {
        if (files.length === 0 || !user) return;

        // Vibe Guard Check (Client Side)
        if (!validateContent(caption)) {
            alert("⚠️ Vibe Guard Policy: Postingan kamu mengandung kata-kata yang tidak sesuai dengan adab AyokeMasjid (Kasar/SARA/NSFW). Yuk, tulis caption yang lebih adem! ✨");
            return;
        }

        setLoading(true);
        setErrors([]);
        setUploadStatus('Securing connection...');

        try {
            // 1. Upload multiple files
            setUploadStatus('Uploading & scanning for safety...');
            const formData = new FormData();
            files.forEach(fileObj => {
                formData.append('files[]', fileObj.file);
            });
            formData.append('user_id', user.id);
            formData.append('caption', caption);

            // Simulate progress phases for UX
            setTimeout(() => setUploadStatus('Running AI Content Moderation...'), 1500);
            setTimeout(() => setUploadStatus('Optimizing storage & quality...'), 3500);

            const uploadResponse = await fetch('http://localhost/AKM.2.0/api/upload_multiple.php', {
                method: 'POST',
                body: formData,
            });
            const uploadData = await uploadResponse.json();

            if (uploadData.success) {
                setUploadStatus('Finalizing post...');
                console.log('Upload successful:', uploadData);

                // Show warnings if some files failed but some succeeded
                if (uploadData.data.errors && uploadData.data.errors.length > 0) {
                    setErrors(uploadData.data.errors);
                }

                // 2. Create post with multiple media
                const selectedVibe = musicSuggestions.find(s => s.name === audioName);
                const finalAudioUrl = selectedVibe ? selectedVibe.url : null;

                const postResponse = await fetch('http://localhost/AKM.2.0/api/posts_multiple.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        caption: caption,
                        mediaFiles: uploadData.data.files,
                        location: location || null,
                        tags: tags || null,
                        audioName: audioName || null,
                        audioUrl: finalAudioUrl
                    }),
                });
                const postData = await postResponse.json();

                if (postData.success) {
                    console.log('Post created successfully:', postData);
                    onUploadSuccess();
                    onClose();
                    // Reset fields
                    setFiles([]);
                    setCaption('');
                    setLocation('');
                    setTags('');
                    setAudioName('');
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                } else {
                    console.error('Post creation failed:', postData.error);
                    setErrors(prev => [...prev, postData.error || 'Failed to create post']);
                }
            } else {
                console.error('Upload failed:', uploadData.error);
                setErrors([uploadData.error || 'Upload failed']);
            }
        } catch (error) {
            setErrors([error.message]);
        } finally {
            setLoading(false);
            setUploadStatus('');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={styles.overlay}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className={styles.modal}
                    >
                        <button className={styles.closeButton} onClick={onClose}>
                            <X size={24} />
                        </button>

                        <div style={{ position: 'absolute', top: '12px', left: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700', letterSpacing: '1px' }}>VIBE GUARD ACTIVE</span>
                        </div>

                        <h2 className={styles.title} style={{ marginTop: '10px' }}>Share Your Moment</h2>

                        {/* File Upload Area */}
                        <div
                            className={styles.uploadArea}
                            onClick={() => fileInputRef.current.click()}
                            style={{
                                minHeight: files.length > 0 ? 'auto' : '200px',
                                padding: files.length > 0 ? '16px' : '32px'
                            }}
                        >
                            {files.length > 0 ? (
                                <div style={{ width: '100%' }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: files.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                                        gap: '12px',
                                        marginBottom: '16px'
                                    }}>
                                        {files.map(fileObj => (
                                            <div key={fileObj.id} style={{ position: 'relative' }}>
                                                {fileObj.type === 'image' ? (
                                                    <img
                                                        src={fileObj.preview}
                                                        alt={fileObj.name}
                                                        style={{
                                                            width: '100%',
                                                            height: '120px',
                                                            objectFit: 'cover',
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: '100%',
                                                        height: '120px',
                                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <Play size={32} color="rgba(255,255,255,0.6)" />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(fileObj.id);
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '4px',
                                                        right: '4px',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '24px',
                                                        height: '24px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <X size={12} color="white" />
                                                </button>
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '4px',
                                                    left: '4px',
                                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem',
                                                    color: 'white'
                                                }}>
                                                    {formatFileSize(fileObj.size)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {files.length < 10 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRef.current.click();
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                border: '2px dashed rgba(255,255,255,0.3)',
                                                borderRadius: '8px',
                                                color: 'rgba(255,255,255,0.8)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Plus size={20} />
                                            Add More Files
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Upload size={48} color="rgba(255,255,255,0.4)" />
                                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Tap to pick images or videos</p>
                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                                        Up to 10 files • Max 50MB each • Halal content only ✨
                                    </p>
                                </>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                                accept="image/*,video/*"
                                multiple
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Caption</label>
                            <textarea
                                className={styles.textInput}
                                placeholder="Tulis caption keberkahan kamu... #GenZHijrah"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className={styles.inputGroup}>
                                <label>Location</label>
                                <input
                                    className={styles.textInput}
                                    type="text"
                                    placeholder="Masjid Al-Akbar..."
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Tags</label>
                                <input
                                    className={styles.textInput}
                                    type="text"
                                    placeholder="travel, food, friends"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Vibe Music 🎵</label>
                            <select
                                className={styles.textInput}
                                value={audioName}
                                onChange={(e) => setAudioName(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '16px',
                                    paddingRight: '40px'
                                }}
                            >
                                <option value="" disabled>Pilih Vibe Music...</option>
                                {musicSuggestions.map(s => (
                                    <option key={s.name} value={s.name} style={{ backgroundColor: '#111' }}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Error Display */}
                        {errors.length > 0 && (
                            <div style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '16px'
                            }}>
                                {errors.map((error, index) => (
                                    <div key={index} style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: '4px' }}>
                                        • {error}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            className={styles.postButton}
                            onClick={handleUpload}
                            disabled={files.length === 0 || loading}
                            style={{
                                background: loading ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)',
                                fontWeight: '800'
                            }}
                        >
                            {loading ? (uploadStatus || "CHECKING VIBE...") : `SIARKAN KEBERKAHAN (${files.length} file${files.length > 1 ? 's' : ''})`}
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UploadModal;
