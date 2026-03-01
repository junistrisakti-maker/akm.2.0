import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Video, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const MultiFileUpload = ({ 
  onUploadComplete, 
  maxFiles = 10, 
  maxSize = 50 * 1024 * 1024, // 50MB
  userId,
  className = ""
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const fileInputRef = useRef(null);

  const allowedTypes = {
    'image/jpeg': { icon: Image, name: 'JPEG', maxSize: 10 * 1024 * 1024 },
    'image/png': { icon: Image, name: 'PNG', maxSize: 10 * 1024 * 1024 },
    'image/webp': { icon: Image, name: 'WebP', maxSize: 10 * 1024 * 1024 },
    'video/mp4': { icon: Video, name: 'MP4', maxSize: 50 * 1024 * 1024 },
    'video/webm': { icon: Video, name: 'WebM', maxSize: 50 * 1024 * 1024 },
    'video/quicktime': { icon: Video, name: 'MOV', maxSize: 50 * 1024 * 1024 }
  };

  const validateFile = (file) => {
    if (!allowedTypes[file.type]) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    const typeConfig = allowedTypes[file.type];
    if (file.size > typeConfig.maxSize) {
      return {
        valid: false,
        error: `${typeConfig.name} files must be smaller than ${formatFileSize(typeConfig.maxSize)}`
      };
    }

    return { valid: true };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const newErrors = [];
    const validFiles = [];

    // Check total file count
    if (files.length + selectedFiles.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed`);
      return;
    }

    selectedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          name: file.name,
          size: file.size
        });
      } else {
        newErrors.push(`${file.name}: ${validation.error}`);
      }
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

  const uploadFiles = async () => {
    if (files.length === 0) {
      setErrors(['Please select at least one file']);
      return;
    }

    if (!userId) {
      setErrors(['User authentication required']);
      return;
    }

    setUploading(true);
    setErrors([]);

    try {
      const formData = new FormData();
      files.forEach(fileObj => {
        formData.append('files[]', fileObj.file);
      });
      formData.append('user_id', userId);
      formData.append('caption', caption);

      const response = await fetch('/api/upload_multiple.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Create post with uploaded files
        const postData = {
          userId,
          caption,
          mediaFiles: result.data.files,
          location: location || null,
          tags: tags || null
        };

        const postResponse = await fetch('/api/posts_multiple.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
        });

        const postResult = await postResponse.json();

        if (postResult.success) {
          onUploadComplete?.(postResult.data);
          // Reset form
          setFiles([]);
          setCaption('');
          setLocation('');
          setTags('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          setErrors([postResult.error || 'Failed to create post']);
        }
      } else {
        setErrors([result.error || 'Upload failed']);
      }
    } catch (error) {
      setErrors(['Upload failed: ' + error.message]);
    } finally {
      setUploading(false);
    }
  };

  const FilePreview = ({ fileObj }) => {
    const IconComponent = allowedTypes[fileObj.file.type]?.icon || AlertCircle;
    
    return (
      <div className="relative group border rounded-lg overflow-hidden bg-gray-50">
        <div className="aspect-square relative">
          {fileObj.preview ? (
            <img 
              src={fileObj.preview} 
              alt={fileObj.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <IconComponent className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          <button
            onClick={() => removeFile(fileObj.id)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-2">
          <p className="text-xs font-medium truncate">{fileObj.name}</p>
          <p className="text-xs text-gray-500">{formatFileSize(fileObj.size)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        
        <p className="text-lg font-medium text-gray-700 mb-2">
          Share Your Moment
        </p>
        
        <p className="text-sm text-gray-500 mb-4">
          Upload up to {maxFiles} files (images and videos)
        </p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Select Files'}
        </button>
        
        <p className="text-xs text-gray-400 mt-2">
          Supported: JPG, PNG, WebP, MP4, WebM, MOV (Max: {formatFileSize(maxSize)})
        </p>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map(fileObj => (
            <FilePreview key={fileObj.id} fileObj={fileObj} />
          ))}
        </div>
      )}

      {/* Caption and Metadata */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share your story..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {caption.length}/500 characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where was this moment?"
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="travel, food, friends"
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={uploadFiles}
            disabled={uploading || files.length === 0}
            className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Share Moment ({files.length} file{files.length > 1 ? 's' : ''})
              </>
            )}
          </button>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-medium text-red-800">Errors</h3>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {!uploading && files.length === 0 && (
        <div className="text-center text-sm text-gray-500">
          Select files to start sharing your moment
        </div>
      )}
    </div>
  );
};

export default MultiFileUpload;
