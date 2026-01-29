import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { CheckCircle, Sparkles, MapPin, Heart } from 'lucide-react';

interface OnboardingCompleteProps {
  userName: string;
  sportsCount: number;
  location: string;
}

export function OnboardingComplete({ userName, sportsCount, location }: OnboardingCompleteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        if (p.y > canvas.height + 50) {
          particles.splice(index, 1);
        }
      });

      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Confetti Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            You're All Set{userName ? `, ${userName}` : ''}!
          </h2>
          <p className="text-xl text-gray-600 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Welcome to the PlayPals community
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto"
        >
          {sportsCount > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-500 font-medium">Favorite Sports</p>
                  <p className="text-lg font-bold text-gray-900">{sportsCount} selected</p>
                </div>
              </div>
            </div>
          )}

          {location && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm text-gray-500 font-medium">Location</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{location}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20"
        >
          <h3 className="font-bold text-gray-900 mb-2">What's Next?</h3>
          <p className="text-gray-600 text-sm">
            Discover events near you, connect with athletes, and start playing!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
