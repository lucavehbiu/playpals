import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { WelcomeHero } from '@/components/onboarding/WelcomeHero';
import { BenefitCard } from '@/components/onboarding/BenefitCard';
import { Calendar, Users, TrendingUp, ArrowRight } from 'lucide-react';

export default function Welcome() {
  const [, setLocation] = useLocation();

  const benefits = [
    {
      icon: Calendar,
      title: 'Find Events',
      description: 'Discover pickup games, tournaments, and sports events happening near you.',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: Users,
      title: 'Make Friends',
      description: 'Connect with athletes who share your passion and build lasting friendships.',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      icon: TrendingUp,
      title: 'Stay Active',
      description: 'Track your progress, join challenges, and stay motivated to reach your goals.',
      gradient: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Hero Section */}
      <WelcomeHero />

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Why PlayPals?</h2>
          <p className="text-gray-600 text-lg">Everything you need to stay active and connected</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <BenefitCard
              key={benefit.title}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
              gradient={benefit.gradient}
              delay={1.2 + index * 0.1}
            />
          ))}
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto"
        >
          <Button
            onClick={() => setLocation('/auth?mode=signup')}
            className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            onClick={() => setLocation('/auth?mode=signin')}
            variant="outline"
            className="w-full sm:w-auto h-14 px-8 text-lg font-semibold rounded-2xl border-2 hover:bg-gray-50"
          >
            Sign In
          </Button>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="text-center text-sm text-gray-500 mt-8"
        >
          Join thousands of athletes already on PlayPals
        </motion.p>
      </div>
    </div>
  );
}
