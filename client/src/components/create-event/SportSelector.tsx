import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface SportSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const SPORTS = [
  { id: 'basketball', label: 'Basketball', emoji: '🏀', color: 'from-orange-500 to-orange-600' },
  { id: 'soccer', label: 'Soccer', emoji: '⚽', color: 'from-green-500 to-green-600' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾', color: 'from-yellow-500 to-yellow-600' },
  { id: 'volleyball', label: 'Volleyball', emoji: '🏐', color: 'from-blue-500 to-blue-600' },
  { id: 'cycling', label: 'Cycling', emoji: '🚴', color: 'from-red-500 to-red-600' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘', color: 'from-purple-500 to-purple-600' },
  { id: 'running', label: 'Running', emoji: '🏃', color: 'from-indigo-500 to-indigo-600' },
  { id: 'swimming', label: 'Swimming', emoji: '🏊', color: 'from-cyan-500 to-cyan-600' },
  { id: 'football', label: 'Football', emoji: '🏈', color: 'from-amber-700 to-amber-800' },
  { id: 'baseball', label: 'Baseball', emoji: '⚾', color: 'from-red-600 to-red-700' },
  { id: 'hiking', label: 'Hiking', emoji: '🥾', color: 'from-emerald-600 to-emerald-700' },
  { id: 'golf', label: 'Golf', emoji: '⛳', color: 'from-lime-500 to-lime-600' },
  { id: 'padel', label: 'Padel', emoji: '🎾', color: 'from-pink-500 to-pink-600' },
  { id: 'other', label: 'Other', emoji: '🎯', color: 'from-gray-500 to-gray-600' },
];

export function SportSelector({ value, onChange }: SportSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {SPORTS.map((sport, index) => {
        const isSelected = value === sport.id;

        return (
          <motion.button
            key={sport.id}
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(sport.id)}
            className={`
              relative p-4 rounded-2xl border-2 transition-all duration-300
              ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-lg'
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
  );
}
