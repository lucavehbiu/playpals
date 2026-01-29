import React, { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IOSSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const IOSSearchBar = ({
  value,
  onChange,
  placeholder = 'Search',
  className,
  onFocus,
  onBlur,
}: IOSSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleCancel = () => {
    onChange('');
    setIsFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div className={cn('flex items-center gap-2 w-full', className)}>
      <div className="relative flex-1 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="block w-full pl-9 pr-8 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-gray-500"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <div className="bg-gray-400 rounded-full p-0.5 hover:bg-gray-500 transition-colors">
              <X className="h-3 w-3 text-white" />
            </div>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && (
          <motion.button
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: 'auto', marginLeft: 8 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCancel}
            className="text-primary text-sm font-medium whitespace-nowrap overflow-hidden"
          >
            Cancel
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
