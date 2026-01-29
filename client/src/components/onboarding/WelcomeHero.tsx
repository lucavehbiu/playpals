import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function WelcomeHero() {
  // Floating sport emojis
  const sportEmojis = ['⚽', '🏀', '🎾', '🏐', '🏃', '🚴', '🧘', '🏊'];

  return (
    <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.3),transparent_50%)]"></div>
      </div>

      {/* Floating Sport Emojis */}
      {sportEmojis.map((emoji, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl opacity-20"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * 400,
          }}
          animate={{
            y: [null, Math.random() * 400 - 200],
            x: [null, Math.random() * window.innerWidth],
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl">
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-secondary blur-xl opacity-50 animate-pulse"></div>
          </div>
        </motion.div>

        {/* App Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-5xl md:text-6xl font-bold text-gray-900 mb-4"
        >
          PlayPals
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-xl md:text-2xl text-gray-600 font-medium mb-2"
        >
          Find Your Game, Find Your People
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-base text-gray-500"
        >
          Join thousands of athletes connecting through sports
        </motion.p>
      </div>
    </div>
  );
}
