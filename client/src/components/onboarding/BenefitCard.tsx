import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface BenefitCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  gradient: string;
}

export function BenefitCard({
  icon: Icon,
  title,
  description,
  delay = 0,
  gradient,
}: BenefitCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all"
    >
      {/* Icon */}
      <div className="mb-4">
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}
