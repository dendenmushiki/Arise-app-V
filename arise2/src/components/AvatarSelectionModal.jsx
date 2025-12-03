import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const AVATAR_OPTIONS = [
  '/assets/avatars/avatar-1.jpg',
  '/assets/avatars/avatar-2.jpg',
  '/assets/avatars/avatar-3.jpg',
  '/assets/avatars/avatar-4.jpg',
  '/assets/avatars/avatar-5.jpg',
  '/assets/avatars/avatar-6.jpg', 
  '/assets/avatars/avatar-7.jpg',
  '/assets/avatars/avatar-8.jpg',
  '/assets/avatars/avatar-9.jpg',
  '/assets/avatars/avatar-10.jpg',
  '/assets/avatars/avatar-11.jpg',
  '/assets/avatars/avatar-12.jpg',
  '/assets/avatars/avatar-13.jpg',
  '/assets/avatars/avatar-14.jpg',
  '/assets/avatars/avatar-15.jpg',
  '/assets/avatars/avatar-16.jpg', 
  '/assets/avatars/avatar-17.jpg',
  '/assets/avatars/avatar-18.jpg',
  '/assets/avatars/avatar-19.jpg',
  '/assets/avatars/avatar-20.jpg',
  '/assets/avatars/avatar-21.jpg',
  '/assets/avatars/avatar-22.jpg',
  '/assets/avatars/avatar-23.jpg',
  '/assets/avatars/avatar-24.jpg',
  '/assets/avatars/avatar-25.jpg',
  '/assets/avatars/avatar-26.jpg', 
  '/assets/avatars/avatar-27.jpg',
  '/assets/avatars/avatar-28.jpg',
  '/assets/avatars/avatar-29.jpg',
  '/assets/avatars/avatar-30.jpg',
  '/assets/avatars/avatar-31.jpg',
  '/assets/avatars/avatar-32.jpg',
  '/assets/avatars/avatar-33.jpg',
  '/assets/avatars/avatar-34.jpg',
  '/assets/avatars/avatar-35.jpg',
  '/assets/avatars/avatar-36.jpg', 
  '/assets/avatars/avatar-37.jpg',
  '/assets/avatars/avatar-38.jpg',
];

export default function AvatarSelectionModal({ isOpen, onClose, onAvatarSelected }) {
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('preset'); // 'preset' or 'upload'

  const handleSelectAvatar = async (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    setUploadedImage(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, or WebP.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage({
        file: file,
        preview: event.target.result,
      });
      setError('');
      setSelectedAvatar(null);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    let avatarToSend;

    if (activeTab === 'preset') {
      if (!selectedAvatar) {
        setError('Please select an avatar');
        return;
      }
      avatarToSend = selectedAvatar;
    } else {
      if (!uploadedImage) {
        setError('Please upload an image');
        return;
      }
      avatarToSend = uploadedImage;
    }

    setIsLoading(true);
    setError('');

    try {
      let response;

      if (activeTab === 'preset') {
        response = await api.post('/update-avatar', { avatarUrl: avatarToSend });
        onAvatarSelected(avatarToSend);
      } else {
        // Upload custom image
        const formData = new FormData();
        formData.append('file', avatarToSend.file);
        response = await api.post('/upload-avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        onAvatarSelected(response.data.avatar);
      }

      setIsLoading(false);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update avatar');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="bg-gradient-to-br from-[#0b0d1c] to-[#0a0b16] border-2 border-violet-700 rounded-lg p-8 max-w-2xl w-full"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.4, type: 'spring' }}
        >
          <motion.h2
            className="text-2xl font-bold text-white mb-6 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Choose Your Avatar
          </motion.h2>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-violet-600">
            <motion.button
              onClick={() => setActiveTab('preset')}
              className={`pb-3 px-4 font-semibold transition-all ${
                activeTab === 'preset'
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              📷 Preset Avatars
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('upload')}
              className={`pb-3 px-4 font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              ⬆️ Upload Custom
            </motion.button>
          </div>

          {/* Preset Avatars Tab */}
          {activeTab === 'preset' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-h-96 overflow-y-auto pr-2"
            >
              <div className="grid grid-cols-5 gap-4 mb-6">
                {AVATAR_OPTIONS.map((avatar, idx) => (
                  <motion.div
                    key={idx}
                    className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                      selectedAvatar === avatar
                        ? 'border-violet-400 bg-violet-500/20'
                        : 'border-violet-600/50 hover:border-violet-500'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectAvatar(avatar)}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${idx + 1}`}
                      className="w-full h-20 object-cover rounded"
                      onError={(e) => {
                        try {
                          const el = e.target;
                          const src = el.src || avatar || '';
                          if (src && src.endsWith('.png')) {
                            const svgSrc = src.replace(/\.png$/i, '.svg');
                            if (svgSrc !== src) {
                              el.onerror = null;
                              el.src = svgSrc;
                              return;
                            }
                          }
                        } catch (err) {}
                        e.target.src = '/assets/avatars/default-avatar.svg';
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Upload Custom Avatar Tab */}
          {activeTab === 'upload' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-semibold mb-2">
                  Upload Image (JPEG, PNG, WebP - Max 5MB)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="w-full p-3 bg-violet-900/30 border-2 border-dashed border-violet-500 rounded-lg cursor-pointer text-gray-300 hover:bg-violet-900/50 transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-2">Click to select or drag and drop</p>
                </div>
              </div>

              {uploadedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 mb-6"
                >
                  <p className="text-violet-300 text-sm font-semibold">Preview:</p>
                  <img
                    src={uploadedImage.preview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-violet-500"
                  />
                  <p className="text-gray-400 text-xs">
                    {(uploadedImage.file.size / 1024).toFixed(2)} KB
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {error && (
            <motion.p
              className="text-red-400 text-center mb-4 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ❌ {error}
            </motion.p>
          )}

          {/* Buttons */}
          <div className="flex gap-4 justify-center m-6">
            <motion.button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleConfirm}
              className="px-6 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading || (activeTab === 'preset' && !selectedAvatar) || (activeTab === 'upload' && !uploadedImage)}
            >
              {isLoading ? 'Saving...' : 'Confirm'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
