'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { 
  Search, MapPin, BatteryCharging, Accessibility, 
  Navigation, Clock, ShieldCheck, Star, Heart, 
  TrendingUp, Globe,
  AtSign, Play, Camera, Send, Music2,
  ChevronRight, LocateFixed, Zap, Shield, Warehouse, Loader2, X, Sparkles,
  Sun, Moon
} from 'lucide-react';
import dynamic from 'next/dynamic';
import DotField from './DotField';
import BorderGlow from './BorderGlow';

const ParkingMap = dynamic(() => import('./ParkingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900/50 rounded-[2.5rem]">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Loader2 className="animate-spin" size={18} /> Loading Map...
      </div>
    </div>
  ),
});

// --- Types & Data ---
interface ParkingSpot {
  id: number;
  name: string;
  distance: string;
  walkTime: string;
  hourly: string;
  hourlyNum: number;
  daily: string;
  rating: number;
  available: number;
  total: number;
  features: string[];
  lat: number;
  lng: number;
}

// Preset popular locations for instantaneous fallbacks
const PRESET_LOCATIONS: Record<string, { lat: number; lng: number; name: string }> = {
  vadodara: { lat: 22.3072, lng: 73.1812, name: "Vadodara, Gujarat, India" },
  mumbai: { lat: 19.0760, lng: 72.8777, name: "Mumbai, Maharashtra, India" },
  bengaluru: { lat: 12.9716, lng: 77.5946, name: "Bengaluru, Karnataka, India" },
  bangalore: { lat: 12.9716, lng: 77.5946, name: "Bengaluru, Karnataka, India" },
  delhi: { lat: 28.6139, lng: 77.2090, name: "New Delhi, India" },
  ahmedabad: { lat: 23.0225, lng: 72.5714, name: "Ahmedabad, Gujarat, India" },
  pune: { lat: 18.5204, lng: 73.8567, name: "Pune, Maharashtra, India" },
  hyderabad: { lat: 17.3850, lng: 78.4867, name: "Hyderabad, Telangana, India" },
  london: { lat: 51.5074, lng: -0.1278, name: "London, United Kingdom" },
  "new york": { lat: 40.7128, lng: -74.0060, name: "New York, NY, USA" },
};

const INITIAL_SPOTS: ParkingSpot[] = [
  { id: 1, name: "Central Plaza Parking", distance: "0.4 km", walkTime: "5 min", hourly: "₹40", hourlyNum: 40, daily: "₹250", rating: 4.8, available: 18, total: 120, features: ["EV", "Covered", "24h"], lat: 12.9716, lng: 77.5946 },
  { id: 2, name: "Skyview Garage", distance: "0.8 km", walkTime: "10 min", hourly: "₹60", hourlyNum: 60, daily: "₹400", rating: 4.5, available: 5, total: 80, features: ["Valet", "Secure"], lat: 12.9750, lng: 77.5900 },
  { id: 3, name: "Green Park Lot", distance: "1.2 km", walkTime: "15 min", hourly: "₹30", hourlyNum: 30, daily: "₹200", rating: 4.2, available: 45, total: 150, features: ["EV", "Handicap"], lat: 12.9680, lng: 77.5990 },
  { id: 4, name: "Metro Station Hub", distance: "0.2 km", walkTime: "2 min", hourly: "₹50", hourlyNum: 50, daily: "₹300", rating: 4.9, available: 12, total: 200, features: ["Secure", "24h"], lat: 12.9720, lng: 77.5930 },
  { id: 5, name: "The Grand Mall", distance: "1.5 km", walkTime: "18 min", hourly: "₹70", hourlyNum: 70, daily: "₹500", rating: 4.7, available: 32, total: 300, features: ["Valet", "Covered", "EV"], lat: 12.9780, lng: 77.5960 },
  { id: 6, name: "Business District B1", distance: "0.6 km", walkTime: "8 min", hourly: "₹45", hourlyNum: 45, daily: "₹280", rating: 4.4, available: 8, total: 50, features: ["Secure", "Handicap"], lat: 12.9700, lng: 77.5910 },
];

const FILTERS = ["Nearby", "Cheapest", "Open Now", "EV Charging", "Covered Parking", "Handicap Access", "24 Hours", "Valet", "Secure Parking"];

function generateSpotsForLocation(lat: number, lng: number, placeName: string): ParkingSpot[] {
  const cityName = placeName.split(',')[0].trim();
  const suffixes = [
    { title: "Central Plaza", dist: "0.3 km", walk: "4 min", hourly: 40, daily: 250, feat: ["EV", "Covered", "24h"], avail: 18, total: 100, offLat: 0.002, offLng: 0.003 },
    { title: "Metro Hub Parking", dist: "0.5 km", walk: "6 min", hourly: 35, daily: 220, feat: ["Secure", "24h"], avail: 24, total: 150, offLat: -0.003, offLng: 0.002 },
    { title: "Skyline Tower Garage", dist: "0.8 km", walk: "10 min", hourly: 60, daily: 400, feat: ["Valet", "Secure", "EV"], avail: 8, total: 80, offLat: 0.005, offLng: -0.004 },
    { title: "Grand Galleria Parking", dist: "1.1 km", walk: "14 min", hourly: 50, daily: 320, feat: ["Covered", "Handicap"], avail: 32, total: 200, offLat: -0.004, offLng: -0.005 },
    { title: "Station Express Park", dist: "0.2 km", walk: "3 min", hourly: 30, daily: 180, feat: ["24h", "Secure"], avail: 4, total: 60, offLat: 0.001, offLng: -0.002 },
    { title: "Civic Center Underground", dist: "1.4 km", walk: "17 min", hourly: 45, daily: 280, feat: ["EV", "Covered", "Handicap"], avail: 50, total: 250, offLat: -0.006, offLng: 0.006 }
  ];

  return suffixes.map((s, idx) => ({
    id: idx + 101,
    name: `${cityName} ${s.title}`,
    distance: s.dist,
    walkTime: s.walk,
    hourly: `₹${s.hourly}`,
    hourlyNum: s.hourly,
    daily: `₹${s.daily}`,
    rating: Number((4.3 + (idx * 0.1) % 0.6).toFixed(1)),
    available: s.avail,
    total: s.total,
    features: s.feat,
    lat: lat + s.offLat,
    lng: lng + s.offLng
  }));
}

const GlassCard = ({ children, className = "", isLight = false }: { children: React.ReactNode; className?: string; isLight?: boolean }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    className="h-full"
  >
    <BorderGlow
      edgeSensitivity={25}
      glowRadius={45}
      glowIntensity={1.2}
      borderRadius={24}
      backgroundColor={isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.5)'}
      glowColor={isLight ? "215 90 60" : "210 95 70"}
      colors={isLight ? ['#3b82f6', '#6366f1', '#0284c7'] : ['#60a5fa', '#a855f7', '#38bdf8']}
      className={`liquid-glass p-6 h-full transition-all duration-300 ${className}`}
    >
      {children}
    </BorderGlow>
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, desc, delay, isLight }: { icon: LucideIcon; title: string; desc: string; delay: number; isLight: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8 }}
    className="h-full"
  >
    <BorderGlow
      edgeSensitivity={30}
      glowRadius={50}
      glowIntensity={1.3}
      borderRadius={24}
      backgroundColor={isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.5)'}
      glowColor={isLight ? "215 90 60" : "210 95 70"}
      colors={isLight ? ['#3b82f6', '#6366f1', '#0284c7'] : ['#60a5fa', '#a855f7', '#38bdf8']}
      className="liquid-glass p-8 flex flex-col gap-4 h-full"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLight ? 'bg-blue-500/10 text-blue-600' : 'bg-white/5 text-blue-400'}`}>
        <Icon size={24} />
      </div>
      <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</h3>
      <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/50'}`}>{desc}</p>
    </BorderGlow>
  </motion.div>
);

export default function EasyParkApp() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocationName, setCurrentLocationName] = useState("Bengaluru, Karnataka, India");
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [mapZoom, setMapZoom] = useState(14);
  const [parkingData, setParkingData] = useState<ParkingSpot[]>(INITIAL_SPOTS);
  const [activeFilter, setActiveFilter] = useState("Nearby");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);

  const isLight = theme === 'light';

  // Toggle favorite
  const toggleFavorite = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Perform geocoding search
  const handleSearch = async (queryToSearch: string) => {
    const trimmed = queryToSearch.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchError(null);

    const lower = trimmed.toLowerCase();

    // Check instant preset match first
    const presetKey = Object.keys(PRESET_LOCATIONS).find(key => lower.includes(key));
    if (presetKey) {
      const loc = PRESET_LOCATIONS[presetKey];
      setMapCenter([loc.lat, loc.lng]);
      setMapZoom(14);
      setCurrentLocationName(loc.name);
      setParkingData(generateSpotsForLocation(loc.lat, loc.lng, loc.name));
      setIsSearching(false);
      return;
    }

    // Otherwise use OpenStreetMap Nominatim Geocoding API
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const displayName = item.display_name || trimmed;

        setMapCenter([lat, lng]);
        setMapZoom(14);
        setCurrentLocationName(displayName);
        setParkingData(generateSpotsForLocation(lat, lng, displayName));
      } else {
        setSearchError(`No coordinates found for "${trimmed}". Try searching e.g., "Vadodara", "Mumbai", "London".`);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setSearchError("Failed to fetch location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Get current GPS location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported by your browser.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const label = "Your Current Location";
        setMapCenter([lat, lng]);
        setMapZoom(15);
        setCurrentLocationName(label);
        setParkingData(generateSpotsForLocation(lat, lng, label));
        setIsSearching(false);
      },
      (err) => {
        console.error("GPS error:", err);
        setSearchError("Could not access your location. Please check browser permissions.");
        setIsSearching(false);
      },
      { timeout: 10000 }
    );
  };

  // Filter & Sort parking data
  const filteredSpots = parkingData.filter(spot => {
    if (activeFilter === "EV Charging") return spot.features.includes("EV");
    if (activeFilter === "Covered Parking") return spot.features.includes("Covered");
    if (activeFilter === "Handicap Access") return spot.features.includes("Handicap");
    if (activeFilter === "24 Hours") return spot.features.includes("24h");
    if (activeFilter === "Valet") return spot.features.includes("Valet");
    if (activeFilter === "Secure Parking") return spot.features.includes("Secure");
    if (activeFilter === "Open Now") return spot.available > 0;
    return true;
  }).sort((a, b) => {
    if (activeFilter === "Cheapest") return a.hourlyNum - b.hourlyNum;
    return 0; // Default nearby
  });

  return (
    <div className={theme}>
      <main className={`relative w-full min-h-screen overflow-x-hidden flex flex-col items-center font-sans transition-colors duration-500 ${
        isLight ? 'bg-slate-50 text-slate-900 selection:bg-blue-500/20 selection:text-slate-900' : 'bg-slate-950 text-white selection:bg-blue-500/30 selection:text-white'
      }`}>
        {/* Background Multi-Gradient Canvas Base */}
        <div className={`fixed inset-0 pointer-events-none z-[0] transition-opacity duration-500 ${
          isLight 
            ? 'bg-[radial-gradient(ellipse_100%_100%_at_50%_-10%,rgba(186,230,253,0.7),rgba(224,231,255,0.5),rgba(248,250,252,1))]' 
            : 'bg-[radial-gradient(ellipse_100%_100%_at_50%_-10%,rgba(30,58,138,0.35),rgba(15,23,42,0.8),rgba(2,6,23,1))]'
        }`} />

        {/* Ambient Glowing Gradient Orbs */}
        <div className={`fixed top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[130px] pointer-events-none z-[0] ${
          isLight ? 'bg-sky-300/30' : 'bg-blue-600/20'
        }`} />
        <div className={`fixed bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full blur-[130px] pointer-events-none z-[0] ${
          isLight ? 'bg-indigo-300/25' : 'bg-indigo-600/20'
        }`} />
        <div className={`fixed top-[35%] right-[25%] w-[40%] h-[40%] rounded-full blur-[110px] pointer-events-none z-[0] ${
          isLight ? 'bg-blue-200/30' : 'bg-sky-500/15'
        }`} />

        {/* Interactive React Bits DotField Background */}
        <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden opacity-80">
          <DotField
            dotRadius={1.5}
            dotSpacing={14}
            bulgeStrength={42}
            glowRadius={180}
            sparkle={true}
            waveAmplitude={0}
            cursorRadius={320}
            cursorForce={0.08}
            gradientFrom={isLight ? 'rgba(37, 99, 235, 0.45)' : 'rgba(96, 165, 250, 0.55)'}
            gradientTo={isLight ? 'rgba(99, 102, 241, 0.30)' : 'rgba(168, 85, 247, 0.40)'}
            glowColor={isLight ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 58, 138, 0.25)'}
          />
        </div>

        {/* Fixed City Night Traffic Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className={`fixed inset-0 w-full h-full object-cover z-[0] transition-all duration-500 ${
            isLight 
              ? 'opacity-15 filter brightness-110 contrast-110 mix-blend-multiply' 
              : 'opacity-30 filter contrast-125 brightness-90'
          }`}
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-car-driving-through-a-city-at-night-41571-large.mp4" type="video/mp4" />
          <source src="https://assets.mixkit.co/videos/preview/mixkit-hyper-lapse-of-a-traffic-at-night-42861-large.mp4" type="video/mp4" />
        </video>
        <div className={`fixed inset-0 z-[1] pointer-events-none transition-all duration-500 ${
          isLight 
            ? 'bg-gradient-to-b from-white/70 via-blue-50/40 to-slate-100/80' 
            : 'bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/80'
        }`} />

        {/* Content Wrapper */}
        <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 md:px-10">
          
          {/* Navbar (Floating Apple Glass Dock) */}
          <nav className={`mt-6 mb-8 py-4 px-6 md:px-8 liquid-glass rounded-full flex justify-between items-center shadow-2xl backdrop-blur-xl transition-all ${
            isLight ? 'border-white/80 bg-white/75' : 'border-white/10'
          }`}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <MapPin className="text-white" size={20} />
              </div>
              <span className={`text-xl font-bold tracking-tight flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                EasyPark <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
                  isLight ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>Smart</span>
              </span>
            </motion.div>

            {/* Nav Links */}
            <div className={`hidden md:flex items-center gap-8 text-sm font-medium ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
              <a href="#search" className="hover:text-blue-600 transition-colors">Search</a>
              <a href="#map" className="hover:text-blue-600 transition-colors">Live Map</a>
              <a href="#spots" className="hover:text-blue-600 transition-colors">Nearby Spots</a>
              <a href="#features" className="hover:text-blue-600 transition-colors">Why EasyPark</a>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Switcher Button */}
              <motion.button
                onClick={() => setTheme(isLight ? 'dark' : 'light')}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className={`p-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                  isLight 
                    ? 'bg-amber-100/90 text-amber-600 border-amber-300 shadow-sm hover:bg-amber-200' 
                    : 'liquid-glass text-amber-300 border-white/20 hover:bg-white/10'
                }`}
                title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {isLight ? <Sun size={18} /> : <Moon size={18} />}
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-5 py-2 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer border ${
                  isLight 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md hover:bg-blue-700' 
                    : 'liquid-glass text-white border-white/15 hover:bg-white/10'
                }`}
              >
                Sign In
              </motion.button>
            </div>
          </nav>

          {/* Hero Section */}
          <section className="pt-10 pb-8 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-medium mb-6 border ${
                isLight 
                  ? 'bg-blue-50/90 text-blue-700 border-blue-300/80 shadow-sm' 
                  : 'liquid-glass text-blue-300 border-blue-500/20'
              }`}
            >
              <Sparkles size={14} className="text-blue-500" />
              <span>AI-Powered Real-Time Urban Parking Discovery</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`text-5xl md:text-8xl font-bold tracking-tight mb-6 leading-[1.1] ${isLight ? 'text-slate-900' : 'text-white'}`}
            >
              Find Parking <br /> 
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${
                isLight ? 'from-blue-700 via-indigo-600 to-slate-700' : 'from-white via-white/80 to-white/40'
              }`}>Before You Arrive.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={`max-w-2xl text-base md:text-xl leading-relaxed mb-8 ${isLight ? 'text-slate-600' : 'text-white/60'}`}
            >
              EasyPark helps drivers instantly discover nearby parking spaces, compare live availability, pricing, EV charging, accessibility, and navigate seamlessly.
            </motion.p>
          </section>

          {/* Search Interface */}
          <section id="search" className="mb-16">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(searchQuery);
              }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={`rounded-full p-2.5 flex items-center gap-3 max-w-3xl mx-auto shadow-2xl relative border backdrop-blur-2xl transition-all ${
                  isLight 
                    ? 'bg-white/90 border-slate-200/90 text-slate-900 shadow-blue-500/5' 
                    : 'liquid-glass border-white/15 text-white'
                }`}
              >
                <div className={`pl-5 flex items-center justify-center ${isLight ? 'text-slate-400' : 'text-white/50'}`}>
                  {isSearching ? (
                    <Loader2 size={22} className="animate-spin text-blue-500" />
                  ) : (
                    <Search size={22} />
                  )}
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search destination, mall, airport, city (e.g. Vadodara, Mumbai)..."
                  className={`flex-1 bg-transparent border-none outline-none text-base md:text-lg py-3 pr-2 min-w-0 ${
                    isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-white/35'
                  }`}
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery("")}
                    className={`p-2 transition-colors flex items-center justify-center ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'}`}
                  >
                    <X size={18} />
                  </button>
                )}
                <motion.button 
                  type="submit"
                  disabled={isSearching}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-7 py-3.5 rounded-full font-bold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 shadow-lg ${
                    isLight 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20' 
                      : 'bg-white text-black hover:bg-blue-50 shadow-white/10'
                  }`}
                >
                  {isSearching ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Searching...
                    </>
                  ) : (
                    "Find Parking"
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Quick Location Chips */}
            <div className={`flex items-center justify-center gap-2 mt-4 flex-wrap text-xs ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
              <span className="flex items-center gap-1 font-medium"><Sparkles size={12} className="text-blue-500" /> Popular Cities:</span>
              {["Vadodara", "Mumbai", "Delhi", "Bengaluru", "London", "New York"].map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setSearchQuery(city);
                    handleSearch(city);
                  }}
                  className={`transition-all px-3 py-1 rounded-full border cursor-pointer ${
                    isLight 
                      ? 'bg-white/80 border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600' 
                      : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-white/30'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Search Error Message */}
            {searchError && (
              <div className="mt-4 text-center text-red-500 text-sm bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-2xl max-w-xl mx-auto font-medium">
                {searchError}
              </div>
            )}

            {/* Current Location Badge */}
            <div className={`mt-5 flex items-center justify-center gap-2 text-sm ${isLight ? 'text-slate-700' : 'text-white/70'}`}>
              <MapPin size={16} className="text-blue-500 animate-pulse" />
              <span>Active Location: <strong className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentLocationName}</strong></span>
            </div>

            {/* Filter Chips Container - Properly Padded & Non-Clipping */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 max-w-5xl mx-auto px-4"
            >
              <div className={`relative border rounded-2xl sm:rounded-full overflow-hidden p-1.5 sm:p-2 shadow-xl backdrop-blur-xl transition-all ${
                isLight ? 'border-slate-200 bg-white/80' : 'border-white/15 liquid-glass'
              }`}>
                <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto py-1 px-3 sm:px-6 hide-scrollbar w-full">
                  {FILTERS.map((filter) => (
                    <motion.button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 shrink-0 cursor-pointer ${
                        activeFilter === filter 
                          ? (isLight ? "bg-blue-600 text-white shadow-md font-bold" : "bg-white text-black shadow-lg font-bold") 
                          : (isLight ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100/80" : "text-white/80 hover:text-white hover:bg-white/10")
                      }`}
                    >
                      {filter}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          {/* Map Section */}
          <section id="map" className="mb-24 relative">
            <motion.div 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className={`rounded-[2.5rem] h-[550px] overflow-hidden border shadow-2xl relative ${
                 isLight ? 'border-slate-200 bg-white/80 shadow-blue-500/5' : 'liquid-glass border-white/10'
               }`}
            >
              <ParkingMap
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                filteredSpots={filteredSpots}
                selectedSpotId={selectedSpotId}
                setSelectedSpotId={setSelectedSpotId}
              />

              {/* Map Toolbar */}
              <div className="absolute top-6 left-6 flex flex-col gap-3 z-[400]">
                <motion.button 
                  title="Locate My Position"
                  onClick={handleCurrentLocation}
                  whileHover={{ scale: 1.1, x: 5 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border cursor-pointer ${
                    isLight 
                      ? 'bg-white/90 text-slate-800 border-slate-200 hover:bg-white' 
                      : 'liquid-glass text-white/80 hover:text-white border-white/10 hover:bg-white/10'
                  }`}
                >
                  <LocateFixed size={20} className="text-blue-500" />
                </motion.button>
                
                {[Zap, Warehouse, Accessibility, TrendingUp, Clock].map((Icon, i) => (
                  <motion.button 
                    key={i}
                    whileHover={{ scale: 1.1, x: 5 }}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md border cursor-pointer ${
                      isLight 
                        ? 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white' 
                        : 'liquid-glass text-white/80 hover:text-white border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={20} />
                  </motion.button>
                ))}
              </div>

              {/* Selected Spot Floating Map Overlay Card */}
              <AnimatePresence>
                {selectedSpotId && (() => {
                  const spot = parkingData.find(s => s.id === selectedSpotId);
                  if (!spot) return null;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      className="absolute top-6 right-6 z-[400] max-w-sm w-full p-2"
                    >
                      <div className={`p-5 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all ${
                        isLight ? 'bg-white/95 border-slate-200 text-slate-900 shadow-blue-500/10' : 'liquid-glass border-white/20 text-white shadow-black/80'
                      }`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-500">Selected Parking Spot</span>
                            <h4 className="font-bold text-base md:text-lg leading-tight mt-0.5">{spot.name}</h4>
                          </div>
                          <button 
                            onClick={() => setSelectedSpotId(null)}
                            className={`p-1.5 rounded-full transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' : 'hover:bg-white/10 text-white/40 hover:text-white'}`}
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <p className={`text-xs mb-4 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                          {spot.hourly} / hr • {spot.distance} away • <strong className="text-emerald-500 font-semibold">{spot.available} available</strong>
                        </p>
                        <div className="flex items-center gap-2">
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all no-underline !text-white"
                            style={{ color: '#ffffff' }}
                          >
                            <Navigation size={14} className="text-white" />
                            <span style={{ color: '#ffffff' }}>Open Google Maps ↗</span>
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* Location Banner overlay on map */}
              <div className="absolute bottom-6 left-6 right-6 z-[400] pointer-events-none flex justify-center">
                <div className={`px-6 py-3 rounded-full text-xs md:text-sm font-medium backdrop-blur-md flex items-center gap-2 border shadow-xl ${
                  isLight 
                    ? 'bg-white/90 text-slate-800 border-slate-200' 
                    : 'liquid-glass text-white/90 border-white/15'
                }`}>
                  <MapPin size={16} className="text-blue-500" />
                  <span>Showing <strong className={isLight ? 'text-slate-900' : 'text-white'}>{filteredSpots.length}</strong> parking spots in <strong className={isLight ? 'text-slate-900' : 'text-white'}>{currentLocationName}</strong></span>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Nearby Parking Cards */}
          <section id="spots" className="mb-28">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className={`text-3xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>Nearby Parking</h2>
                <p className={isLight ? 'text-slate-500' : 'text-white/40'}>Available spots around {currentLocationName.split(',')[0]}</p>
              </div>
              <button className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'
              }`}>
                View All ({filteredSpots.length}) <ChevronRight size={16} />
              </button>
            </div>

            {filteredSpots.length === 0 ? (
              <div className={`rounded-3xl p-12 text-center border ${isLight ? 'bg-white/80 border-slate-200 text-slate-500' : 'liquid-glass border-white/10 text-white/50'}`}>
                No parking spots match the filter &quot;{activeFilter}&quot;. Try selecting &quot;Nearby&quot; or another filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSpots.map((spot) => (
                  <GlassCard 
                    key={spot.id} 
                    isLight={isLight}
                    className={`group relative ${
                      selectedSpotId === spot.id 
                        ? 'border-2 border-blue-500/70 bg-blue-500/10' 
                        : (isLight ? 'border border-slate-200/80 bg-white/80 shadow-md hover:border-slate-300' : 'border border-white/10')
                    }`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className={`text-xl font-bold transition-colors ${isLight ? 'text-slate-900 group-hover:text-blue-600' : 'text-white group-hover:text-blue-400'}`}>{spot.name}</h3>
                        <div className={`flex items-center gap-3 text-sm mt-1 flex-wrap ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                          <span className="flex items-center gap-1"><MapPin size={14} /> {spot.distance}</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> {spot.walkTime}</span>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 font-semibold hover:underline"
                          >
                            <Globe size={12} /> Google Maps
                          </a>
                        </div>
                      </div>
                      <motion.button 
                        onClick={() => toggleFavorite(spot.id)}
                        whileTap={{ scale: 0.8 }} 
                        className={`transition-colors cursor-pointer ${favorites.includes(spot.id) ? 'text-red-500' : (isLight ? 'text-slate-300 hover:text-red-500' : 'text-white/20 hover:text-red-500')}`}
                      >
                        <Heart size={22} fill={favorites.includes(spot.id) ? "currentColor" : "none"} />
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-100/80 border-slate-200/60' : 'bg-white/5 border-white/5'}`}>
                        <p className={`text-[10px] uppercase tracking-wider mb-1 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Hourly Rate</p>
                        <p className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{spot.hourly}<span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-white/40'}`}>/hr</span></p>
                      </div>
                      <div className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-100/80 border-slate-200/60' : 'bg-white/5 border-white/5'}`}>
                        <p className={`text-[10px] uppercase tracking-wider mb-1 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Full Day</p>
                        <p className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{spot.daily}<span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-white/40'}`}>/day</span></p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={16} fill="currentColor" />
                        <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{spot.rating}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${spot.available < 10 ? 'bg-red-500/15 text-red-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
                          {spot.available} / {spot.total} Available
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-8 flex-wrap">
                      {spot.features.includes("EV") && <div title="EV Charging" className="p-2 rounded-lg bg-blue-500/10 text-blue-600"><BatteryCharging size={16} /></div>}
                      {spot.features.includes("Covered") && <div title="Covered Parking" className="p-2 rounded-lg bg-purple-500/10 text-purple-600"><Warehouse size={16} /></div>}
                      {spot.features.includes("Secure") && <div title="24/7 Security" className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600"><Shield size={16} /></div>}
                      {spot.features.includes("Handicap") && <div title="Handicap Access" className="p-2 rounded-lg bg-amber-500/10 text-amber-600"><Accessibility size={16} /></div>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button 
                        onClick={() => {
                          setMapCenter([spot.lat, spot.lng]);
                          setMapZoom(16);
                          setSelectedSpotId(spot.id);
                          window.scrollTo({ top: 500, behavior: 'smooth' });
                        }}
                        className={`py-3 px-2 rounded-2xl text-xs font-semibold transition-colors border cursor-pointer flex items-center justify-center gap-1 ${
                          isLight 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300/80' 
                            : 'liquid-glass hover:bg-white/10 text-white border-white/10'
                        }`}
                      >
                        <LocateFixed size={14} /> Focus Map
                      </button>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`py-3 px-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer border flex items-center justify-center gap-1 shadow-sm no-underline ${
                          isLight 
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300/80' 
                            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        <Navigation size={13} /> Maps Link ↗
                      </a>
                      <button 
                        onClick={() => {
                          alert(`Spot reserved at ${spot.name}! Confirmation code sent to your account.`);
                        }}
                        className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center justify-center ${
                          isLight 
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20' 
                            : 'bg-white text-black hover:bg-blue-50 shadow-white/10'
                        }`}
                      >
                        Reserve
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </section>

          {/* Why EasyPark? */}
          <section id="features" className="mb-28">
            <div className="text-center mb-16">
              <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Why EasyPark?</h2>
              <p className={isLight ? 'text-slate-600' : 'text-white/40'}>Experience the future of seamless urban mobility</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard 
                icon={Clock} 
                title="Real-Time Availability" 
                desc="Never guess again. See live updates on every spot before you even leave your house."
                delay={0.1}
                isLight={isLight}
              />
              <FeatureCard 
                icon={Zap} 
                title="AI Recommendations" 
                desc="Smart algorithms suggest the best parking based on price, distance, and historical data."
                delay={0.2}
                isLight={isLight}
              />
              <FeatureCard 
                icon={ShieldCheck} 
                title="Secure Locations" 
                desc="Every listed parking is verified for safety, lighting, and surveillance for your peace of mind."
                delay={0.3}
                isLight={isLight}
              />
              <FeatureCard 
                icon={Navigation} 
                title="Fast Navigation" 
                desc="Seamlessly integrate with Google Maps, Waze, or Apple Maps for turn-by-turn guidance."
                delay={0.4}
                isLight={isLight}
              />
            </div>
          </section>

          {/* How It Works Timeline */}
          <section className="mb-28">
            <div className="text-center mb-16">
              <h2 className={`text-4xl md:text-5xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>How It Works</h2>
            </div>
            <div className="relative">
              {/* Timeline Line */}
              <div className={`absolute top-1/2 left-0 w-full h-[1px] hidden lg:block ${isLight ? 'bg-slate-300' : 'bg-white/10'}`} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {[
                  { step: "01", title: "Search Destination", desc: "Enter your destination or current location." },
                  { step: "02", title: "Compare Nearby", desc: "View prices, walking time, and live availability." },
                  { step: "03", title: "Reserve Your Spot", desc: "Book instantly and guarantee your parking space." },
                  { step: "04", title: "Navigate & Park", desc: "Follow live directions directly to your spot." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="relative z-10 text-center lg:text-left"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-6 mx-auto lg:mx-0 shadow-lg ${
                      isLight ? 'bg-blue-600 text-white' : 'bg-white text-black'
                    }`}>
                      {item.step}
                    </div>
                    <h3 className={`text-xl font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.title}</h3>
                    <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/40'}`}>{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section className="mb-28 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "Parking Locations", value: "10,000+" },
              { label: "Drivers Served", value: "500K+" },
              { label: "Satisfaction", value: "98%" },
              { label: "Availability", value: "24/7" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.div 
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  className={`text-4xl md:text-6xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-b ${
                    isLight ? 'from-blue-700 to-indigo-900' : 'from-white to-white/40'
                  }`}
                >
                  {stat.value}
                </motion.div>
                <div className={`text-xs md:text-sm uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{stat.label}</div>
              </motion.div>
            ))}
          </section>

          {/* Call to Action */}
          <section className="mb-24">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`rounded-[3rem] p-12 md:p-20 text-center border shadow-2xl ${
                isLight ? 'bg-white/80 border-slate-200/80 shadow-blue-500/5' : 'liquid-glass border-white/10'
              }`}
            >
              <h2 className={`text-4xl md:text-7xl font-bold mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>Never Circle the <br /> Block Again.</h2>
              <p className={`text-lg md:text-xl mb-10 max-w-2xl mx-auto ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                Start using EasyPark today and reach your destination stress-free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  className={`px-10 py-4.5 rounded-full text-lg font-bold shadow-xl transition-colors cursor-pointer ${
                    isLight ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20' : 'bg-white text-black hover:bg-blue-50 shadow-white/10'
                  }`}
                  onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}
                >
                  Find Parking
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  className={`px-10 py-4.5 rounded-full text-lg font-bold border cursor-pointer ${
                    isLight ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200' : 'liquid-glass text-white border-white/15'
                  }`}
                >
                  Learn More
                </motion.button>
              </div>
            </motion.div>
          </section>

          {/* Footer */}
          <motion.footer 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`w-full rounded-3xl p-8 md:p-12 mb-12 border ${
              isLight ? 'bg-white/80 border-slate-200 text-slate-700 shadow-sm' : 'liquid-glass border-white/10 text-white/70'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
              <div className="md:col-span-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg">
                    <MapPin className="text-white" size={20} />
                  </div>
                  <span className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>EasyPark</span>
                </div>
                <p className={`text-sm leading-relaxed max-w-sm ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                  EasyPark makes city parking effortless by helping drivers discover nearby parking spaces, compare live availability, pricing, and navigate with confidence—all from one intelligent platform.
                </p>
              </div>
              
              <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div>
                  <h4 className={`text-sm uppercase tracking-wider font-medium mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Explore</h4>
                  <ul className={`text-xs space-y-2.5 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">Find Parking</li>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">Live Availability</li>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">EV Charging</li>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">Monthly Parking</li>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">Smart Navigation</li>
                  </ul>
                </div>
                <div>
                  <h4 className={`text-sm uppercase tracking-wider font-medium mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Company</h4>
                  <ul className={`text-xs space-y-2.5 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">About</li>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">Careers</li>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">Partners</li>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">Newsroom</li>
                  </ul>
                </div>
                <div>
                  <h4 className={`text-sm uppercase tracking-wider font-medium mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Support</h4>
                  <ul className={`text-xs space-y-2.5 ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">Contact</li>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">Privacy Policy</li>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">Terms of Service</li>
                    <li className="hover:text-blue-600 transition-colors cursor-pointer">Report Issue</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className={`pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4 ${
              isLight ? 'border-slate-200/80' : 'border-white/10'
            }`}>
              <p className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Powered by EasyPark © 2026</p>
              <div className="flex items-center gap-6">
                <span className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Follow Us</span>
                <div className="flex gap-4">
                  {[Music2, AtSign, Play, Camera, Send].map((Icon, i) => (
                    <motion.a 
                      key={i}
                      href="#"
                      whileHover={{ y: -3 }}
                      className={`transition-colors ${isLight ? 'text-slate-600 hover:text-blue-600' : 'text-white/80 hover:text-white'}`}
                    >
                      <Icon size={18} />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
          </motion.footer>
        </div>
      </main>
    </div>
  );
}

