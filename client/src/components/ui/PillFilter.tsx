import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PillFilterProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
  className?: string;
}

export const PillFilter = ({ label, isActive, onClick, count, className }: PillFilterProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap',
        isActive
          ? 'bg-primary text-white shadow-md shadow-primary/20'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50',
        className
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          )}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
};
