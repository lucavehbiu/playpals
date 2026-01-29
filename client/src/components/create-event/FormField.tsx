import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  icon?: ReactNode;
  type?: 'text' | 'number' | 'date' | 'time' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string;
  maxLength?: number;
  autoFocus?: boolean;
}

export function FormField({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  hint,
  required = false,
  min,
  max,
  step,
  maxLength,
  autoFocus,
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const hasValue = value && value.length > 0;
  const showError = error && isTouched && !isFocused;
  const showSuccess = hasValue && !error && isTouched;

  const inputClasses = `
    w-full text-lg p-4 h-14 rounded-2xl border-2 transition-all duration-300
    ${icon ? 'pl-12' : 'pl-4'}
    ${showError ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20' : ''}
    ${showSuccess ? 'border-green-300 bg-green-50/20 focus:border-green-500 focus:ring-green-500/20' : ''}
    ${!showError && !showSuccess ? 'border-gray-200 focus:border-primary focus:ring-primary/20' : ''}
    focus:ring-4 focus:outline-none
  `;

  const textareaClasses = `
    w-full text-lg p-4 rounded-2xl border-2 transition-all duration-300 resize-none
    ${showError ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20' : ''}
    ${showSuccess ? 'border-green-300 bg-green-50/20 focus:border-green-500 focus:ring-green-500/20' : ''}
    ${!showError && !showSuccess ? 'border-gray-200 focus:border-primary focus:ring-primary/20' : ''}
    focus:ring-4 focus:outline-none
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <Label className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        {label}
        {required && <span className="text-red-500 text-sm">*</span>}
      </Label>

      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            {icon}
          </div>
        )}

        {/* Input or Textarea */}
        {type === 'textarea' ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setIsTouched(true);
            }}
            placeholder={placeholder}
            className={textareaClasses}
            maxLength={maxLength}
            autoFocus={autoFocus}
            rows={4}
          />
        ) : (
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setIsTouched(true);
            }}
            placeholder={placeholder}
            className={inputClasses}
            min={min}
            max={max}
            step={step}
            maxLength={maxLength}
            autoFocus={autoFocus}
          />
        )}

        {/* Success Checkmark */}
        {showSuccess && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        )}

        {/* Error Icon */}
        {showError && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
          </motion.div>
        )}

        {/* Character Counter */}
        {maxLength && type === 'textarea' && (
          <div className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">
            {value.length}/{maxLength}
          </div>
        )}
      </div>

      {/* Hint or Error Message */}
      {showError ? (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 font-medium flex items-center gap-1.5"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.p>
      ) : hint ? (
        <p className="text-sm text-gray-500">{hint}</p>
      ) : null}
    </motion.div>
  );
}
