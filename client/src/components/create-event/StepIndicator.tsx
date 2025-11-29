import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  icon: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export function StepIndicator({ steps, currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="w-full px-4 py-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
      {/* Mobile: Compact Progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm font-bold text-primary">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-primary via-secondary to-primary h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 font-medium">{steps[currentStep].label}</p>
      </div>

      {/* Desktop: Full Step Bubbles */}
      <div className="hidden md:flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = index === currentStep;
          const isPast = index < currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Bubble */}
              <div className="flex flex-col items-center relative">
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isCurrent
                      ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg scale-110'
                      : isCompleted || isPast
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: isCurrent ? 1.1 : 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {isCompleted || isPast ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    >
                      <Check className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <span className="text-2xl">{step.icon}</span>
                  )}
                </motion.div>

                {/* Step Label */}
                <motion.p
                  className={`text-xs mt-2 font-medium text-center max-w-[80px] ${
                    isCurrent ? 'text-primary font-bold' : 'text-gray-500'
                  }`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {step.label}
                </motion.p>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 bg-gray-200 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary to-secondary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isPast || isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
