import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

interface OnboardingStepProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showSkip?: boolean;
  isLoading?: boolean;
}

export function OnboardingStep({
  children,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  nextLabel = 'Continue',
  nextDisabled = false,
  showSkip = false,
  isLoading = false,
}: OnboardingStepProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            {showSkip && onSkip && (
              <button
                onClick={onSkip}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
              >
                Skip
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-gray-200/50 shadow-xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 p-6">
        <div className="max-w-2xl mx-auto flex gap-4">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={onBack}
              className="h-14 px-6 rounded-2xl border-2 font-semibold"
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Button>
          )}
          <Button
            onClick={onNext}
            disabled={nextDisabled || isLoading}
            className="flex-1 h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? 'Loading...' : nextLabel}
            {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
