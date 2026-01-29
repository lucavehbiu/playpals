import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useState } from 'react';

interface SportPreferenceSelectorProps {
  selectedSports: string[];
  onChange: (sports: string[]) => void;
}

const SPORTS = [
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'soccer', label: 'Soccer', emoji: '⚽' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾' },
  { id: 'volleyball', label: 'Volleyball', emoji: '🏐' },
  { id: 'cycling', label: 'Cycling', emoji: '🚴' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
  { id: 'running', label: 'Running', emoji: '🏃' },
  { id: 'swimming', label: 'Swimming', emoji: '🏊' },
  { id: 'football', label: 'Football', emoji: '🏈' },
  { id: 'baseball', label: 'Baseball', emoji: '⚾' },
  { id: 'hiking', label: 'Hiking', emoji: '🥾' },
  { id: 'golf', label: 'Golf', emoji: '⛳' },
  { id: 'padel', label: 'Padel', emoji: '🎾' },
  { id: 'other', label: 'Other', emoji: '🎯' },
];

export function SportPreferenceSelector({
  selectedSports,
  onChange,
}: SportPreferenceSelectorProps) {
  const toggleSport = (sportId: string) => {
    if (selectedSports.includes(sportId)) {
      onChange(selectedSports.filter((id) => id !== sportId));
    } else {
      onChange([...selectedSports, sportId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">What sports do you enjoy?</h2>
        <p className="text-gray-600 text-lg">Select all that interest you (choose at least one)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {SPORTS.map((sport, index) => {
          const isSelected = selectedSports.includes(sport.id);

          return (
            <motion.button
              key={sport.id}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSport(sport.id)}
              className={`
                relative p-4 rounded-2xl border-2 transition-all duration-300
                ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
              `}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}

              {/* Sport Emoji */}
              <div className="text-4xl mb-2 flex items-center justify-center">{sport.emoji}</div>

              {/* Sport Label */}
              <p
                className={`text-sm font-bold text-center ${
                  isSelected ? 'text-primary' : 'text-gray-700'
                }`}
              >
                {sport.label}
              </p>
            </motion.button>
          );
        })}
      </div>

      {selectedSports.length > 0 && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-gray-600 font-medium"
        >
          {selectedSports.length} sport{selectedSports.length !== 1 ? 's' : ''} selected
        </motion.p>
      )}
    </div>
  );
}
