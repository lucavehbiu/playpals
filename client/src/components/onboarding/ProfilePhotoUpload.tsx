import { motion } from 'framer-motion';
import { Camera, Upload, User } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ProfilePhotoUploadProps {
  photoUrl: string;
  onPhotoChange: (file: File | null, previewUrl: string) => void;
}

export function ProfilePhotoUpload({ photoUrl, onPhotoChange }: ProfilePhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onPhotoChange(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    onPhotoChange(null, '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Add a profile photo</h2>
        <p className="text-gray-600 text-lg">
          Help others recognize you (you can skip this for now)
        </p>
      </div>

      {/* Photo Preview */}
      <div className="flex justify-center mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-20 h-20 text-gray-400" />
            )}
          </div>

          {/* Upload Button Overlay */}
          {!photoUrl && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            >
              <Camera className="w-10 h-10 text-white" />
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {photoUrl ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-12 rounded-2xl border-2 font-semibold"
            >
              <Upload className="mr-2 h-5 w-5" />
              Change Photo
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleRemove}
              className="w-full h-12 rounded-2xl font-semibold text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Remove Photo
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg font-bold text-lg"
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload Photo
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <p className="text-center text-sm text-gray-500 mt-4">
        Recommended: Square photo, at least 400x400px
      </p>
    </div>
  );
}
