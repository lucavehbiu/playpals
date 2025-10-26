import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import { sportTypes } from '@shared/schema';
import { LocationFilter } from '@/components/filters/LocationFilter';

interface DiscoverFilterSidebarProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  selectedSport: string;
  setSelectedSport: (sport: string) => void;
  locationFilter: any;
  handleLocationFilterChange: (filter: any) => void;
  clearLocationFilter: () => void;
  isLocationFilterActive: boolean;
  locationOptions: { maxRadius: number; minRadius: number };
  dateFilter: string;
  setDateFilter: (date: string) => void;
  showFreeOnly: boolean;
  setShowFreeOnly: (show: boolean) => void;
  showPublicOnly: boolean;
  setShowPublicOnly: (show: boolean) => void;
  contentType: string;
  setContentType: (type: string) => void;
}

export function DiscoverFilterSidebar({
  showFilters,
  setShowFilters,
  selectedSport,
  setSelectedSport,
  locationFilter,
  handleLocationFilterChange,
  clearLocationFilter,
  isLocationFilterActive,
  locationOptions,
  dateFilter,
  setDateFilter,
  showFreeOnly,
  setShowFreeOnly,
  showPublicOnly,
  setShowPublicOnly,
  contentType,
  setContentType,
}: DiscoverFilterSidebarProps) {
  return (
    <AnimatePresence>
      {showFilters && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFilters(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Sidebar Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filters Content */}
            <div className="p-6 space-y-6">
              {/* Sport */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Sport/Activity
                </label>
                <div className="relative">
                  <select
                    className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                  >
                    <option value="all">All Sports</option>
                    {sportTypes.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <LocationFilter
                  value={locationFilter}
                  onChange={handleLocationFilterChange}
                  placeholder="Search location..."
                  showRadiusSlider={true}
                  maxRadius={locationOptions.maxRadius}
                  minRadius={locationOptions.minRadius}
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Date (From)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Quick Filters</p>
                <div className="space-y-2">
                  {/* Content Type Pills */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => setContentType('all')}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        contentType === 'all'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setContentType('events')}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        contentType === 'events'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Events
                    </button>
                    <button
                      onClick={() => setContentType('tournaments')}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        contentType === 'tournaments'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tournaments
                    </button>
                  </div>

                  <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={showFreeOnly}
                      onChange={(e) => setShowFreeOnly(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Free Only</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={showPublicOnly}
                      onChange={(e) => setShowPublicOnly(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Public Only</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setSelectedSport('all');
                  clearLocationFilter();
                  setDateFilter('');
                  setShowFreeOnly(false);
                  setShowPublicOnly(true);
                  setContentType('all');
                }}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                Show Results
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
