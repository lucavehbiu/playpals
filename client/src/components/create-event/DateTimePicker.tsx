import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, addDays } from 'date-fns';

interface DateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

export function DateTimePicker({ date, time, onDateChange, onTimeChange }: DateTimePickerProps) {
  const quickOptions = [
    {
      label: 'Tomorrow 6PM',
      date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      time: '18:00',
    },
    {
      label: 'This Weekend',
      date: format(addDays(new Date(), 6 - new Date().getDay()), 'yyyy-MM-dd'),
      time: '10:00',
    },
    {
      label: 'Next Week',
      date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      time: '18:00',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Select Options */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-3 block">Quick Select</Label>
        <div className="grid grid-cols-3 gap-2">
          {quickOptions.map((option, index) => (
            <motion.button
              key={option.label}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onDateChange(option.date);
                onTimeChange(option.time);
              }}
              className="p-3 rounded-xl border-2 border-gray-200 bg-white hover:border-primary hover:bg-primary/5 transition-all text-xs font-semibold text-gray-700 hover:text-primary"
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Input */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Label htmlFor="date" className="text-sm font-semibold text-gray-700 mb-2 block">
            Date
          </Label>
          <div className="relative">
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="text-lg p-4 h-14 pl-12 rounded-2xl border-2 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/20"
            />
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </motion.div>

        {/* Time Input */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Label htmlFor="time" className="text-sm font-semibold text-gray-700 mb-2 block">
            Time
          </Label>
          <div className="relative">
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
              className="text-lg p-4 h-14 pl-12 rounded-2xl border-2 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/20"
            />
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
