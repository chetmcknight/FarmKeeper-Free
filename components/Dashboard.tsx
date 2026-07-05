import React, { useEffect, useState } from 'react';
import { getWeatherInsight, getMarketPrices } from '../services/geminiService';
import { backend } from '../services/mockBackend';
import { Page } from '../types';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  location: string;
  onNavigate: (page: Page) => void;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

const COMMODITY_OPTIONS = [
  "Corn", "Soybeans", "Wheat", "Oats", 
  "Barley", "Canola", "Alfalfa Hay", "Timothy Hay", "Straw", 
  "Chicken Feed", "Cattle Feed", "Pig Feed", 
  "Milk", "Eggs", "Diesel Fuel", "Urea Fertilizer"
];

const STORE_OPTIONS = [
    { label: "Coastal", value: "Coastal Farm & Ranch" },
    { label: "Leitz", value: "Leitz Farm Supply" },
    { label: "Tractor Supply", value: "Tractor Supply Co." }
];

export const Dashboard: React.FC<DashboardProps> = ({ location, onNavigate, toggleDarkMode, isDarkMode }) => {
  const { user } = useAuth();
  
  const [weatherData, setWeatherData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any[]>([]);

  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingMarkets, setLoadingMarkets] = useState(true);

  const [selectedCommodities, setSelectedCommodities] = useState<string[]>([
    "Oats", "Alfalfa Hay", "Straw", "Chicken Feed"
  ]);
  const [selectedStore, setSelectedStore] = useState<string>(STORE_OPTIONS[0].value);
  
  const [stats, setStats] = useState({ 
    cropsTotal: 0, 
    cropsAttention: 0,
    animalsTotal: 0,
    animalsAttention: 0,
    farmhandsTotal: 0
  });

  useEffect(() => {
    const loadStats = async () => {
        try {
            const [crops, animals, farmhands] = await Promise.all([
                backend.getCrops(),
                backend.getAnimals(),
                backend.getFarmhands()
            ]);
            setStats({
                cropsTotal: crops.length,
                cropsAttention: crops.filter(c => c.status === 'Needs Attention').length,
                animalsTotal: animals.length,
                animalsAttention: animals.filter(a => ['Sick', 'Vet Check Required'].includes(a.status)).length,
                farmhandsTotal: farmhands.length
            });
        } catch (e) {
            console.error("Failed to load stats", e);
        }
    };
    loadStats();
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const fetchGeneral = async () => {
        setLoadingWeather(true);

        getWeatherInsight(location).then(data => {
            if(mounted) {
                setWeatherData(data);
                setLoadingWeather(false);
            }
        });
    };

    fetchGeneral();
    return () => { mounted = false; };
  }, [location]);

  useEffect(() => {
      let mounted = true;
      const fetchMarkets = async () => {
          setLoadingMarkets(true);
          const data = await getMarketPrices(selectedCommodities, selectedStore);
          if (mounted) {
              setMarketData(data);
              setLoadingMarkets(false);
          }
      };
      fetchMarkets();
      return () => { mounted = false; };
  }, [selectedCommodities, selectedStore]);

  const handleCommodityChange = (index: number, value: string) => {
    const newSelections = [...selectedCommodities];
    newSelections[index] = value;
    setSelectedCommodities(newSelections);
  };

  const getMarketItem = (name: string) => {
    return marketData.find((m: any) => 
      m.name.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(m.name.toLowerCase())
    );
  };

  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pr-2 md:pr-0">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{getGreeting()}, {user?.name || 'Farmer'}.</h2>
          {stats.cropsTotal === 0 && stats.animalsTotal === 0 ? (
             <p className="text-green-600 dark:text-green-400 font-bold mt-1">Welcome! Let's get your farm set up by adding your first crop or animal.</p>
          ) : (
             <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Here's what's happening on your farm today.</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 w-fit">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-700 dark:text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{location}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{new Date().toLocaleDateString(undefined, {weekday: 'long', month: 'short', day: 'numeric'})}</p>
              </div>
            </div>

            <button 
                onClick={toggleDarkMode}
                className="p-3 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                title="Toggle Dark Mode"
            >
                {isDarkMode ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
            </button>
        </div>
      </header>
      
      {/* Farm Status Cards */}
      <div className="grid grid-cols-3 gap-4 md:gap-6">
          <div 
            onClick={() => onNavigate(Page.ANIMALS)}
            className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:scale-105 hover:border-blue-200 dark:hover:border-blue-700 transition-all cursor-pointer group"
          >
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">🐐</div>
                  <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Animals</p>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.animalsTotal}</h4>
                  </div>
              </div>
          </div>
          
          <div 
            onClick={() => onNavigate(Page.CROPS)}
            className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:scale-105 hover:border-green-200 dark:hover:border-green-700 transition-all cursor-pointer group"
          >
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">🌽</div>
                  <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Crops</p>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cropsTotal}</h4>
                  </div>
              </div>
          </div>
          <div 
            onClick={() => onNavigate(Page.FARMHANDS)}
            className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:scale-105 hover:border-purple-200 dark:hover:border-purple-700 transition-all cursor-pointer group"
          >
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/40 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">🧑‍🌾</div>
                  <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Farmhands</p>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.farmhandsTotal}</h4>
                  </div>
              </div>
          </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 gap-6">
        {/* Weather Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 p-6 relative overflow-hidden group min-h-[180px]">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <svg className="w-32 h-32 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 relative z-10">Local Weather</h3>
          {loadingWeather ? (
            <div className="animate-pulse space-y-4 mt-4 relative z-10">
                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
          ) : (
            <div className="relative z-10 mt-4 animate-fade-in">
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{weatherData?.current || "--"}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium leading-relaxed">{weatherData?.forecast || "Forecast unavailable."}</p>
            </div>
          )}
        </div>
     </div>
    </div>
  );
};
