import React, { useEffect, useState } from 'react';
import { getDashboardInsights } from '../services/geminiService';
import { backend } from '../services/mockBackend';

interface DashboardProps {
  location: string;
}

const COMMODITY_OPTIONS = [
  "Corn", "Soybeans", "Wheat", "Oats", 
  "Barley", "Canola", "Alfalfa Hay", "Timothy Hay", "Straw", 
  "Chicken Feed", "Cattle Feed", "Pig Feed", 
  "Milk", "Eggs", "Diesel Fuel", "Urea Fertilizer"
];

export const Dashboard: React.FC<DashboardProps> = ({ location }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCommodities, setSelectedCommodities] = useState<string[]>([
    "Oats", "Alfalfa Hay", "Straw", "Chicken Feed"
  ]);
  
  // Farm Stats
  const [stats, setStats] = useState({ 
    cropsTotal: 0, 
    cropsAttention: 0,
    animalsTotal: 0,
    animalsAttention: 0
  });

  useEffect(() => {
    // Load local farm stats
    const loadStats = async () => {
        const crops = await backend.getCrops();
        const animals = await backend.getAnimals();
        setStats({
            cropsTotal: crops.length,
            cropsAttention: crops.filter(c => c.status === 'Needs Attention').length,
            animalsTotal: animals.length,
            animalsAttention: animals.filter(a => ['Sick', 'Vet Check Required'].includes(a.status)).length
        });
    };
    loadStats();
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchInsights = async () => {
      setLoading(true);
      // Hardcoded location as requested for stability
      const data = await getDashboardInsights("Sequim, WA 98382", selectedCommodities);
      if (mounted && data) {
        setInsights(data);
      }
      setLoading(false);
    };
    fetchInsights();
    return () => { mounted = false; };
  }, [selectedCommodities]);

  const handleCommodityChange = (index: number, value: string) => {
    const newSelections = [...selectedCommodities];
    newSelections[index] = value;
    setSelectedCommodities(newSelections);
  };

  const getMarketItem = (name: string) => {
    if (!insights?.market) return null;
    return insights.market.find((m: any) => 
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
    <div className="p-4 md:p-8 space-y-8 pb-32 md:pb-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{getGreeting()}, Farmer.</h2>
          <p className="text-gray-500 font-medium mt-1">Here's what's happening on your farm today.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <div className="bg-green-100 p-2 rounded-lg text-green-700">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div className="text-right">
             <p className="text-sm font-bold text-gray-800">Sequim, WA</p>
             <p className="text-xs text-gray-500 font-medium">{new Date().toLocaleDateString(undefined, {weekday: 'long', month: 'short', day: 'numeric'})}</p>
          </div>
        </div>
      </header>
      
      {/* Farm Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center text-2xl shadow-inner">🌽</div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Crops</p>
                      <h4 className="text-2xl font-bold text-gray-900">{stats.cropsTotal}</h4>
                  </div>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center text-2xl shadow-inner">⚠️</div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Crop Alerts</p>
                      <h4 className={`text-2xl font-bold ${stats.cropsAttention > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                          {stats.cropsAttention}
                      </h4>
                  </div>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-2xl shadow-inner">🐄</div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Livestock</p>
                      <h4 className="text-2xl font-bold text-gray-900">{stats.animalsTotal}</h4>
                  </div>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-2xl shadow-inner">🏥</div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Vet Alerts</p>
                      <h4 className={`text-2xl font-bold ${stats.animalsAttention > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {stats.animalsAttention}
                      </h4>
                  </div>
              </div>
          </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Weather Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <svg className="w-32 h-32 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 relative z-10">Local Weather</h3>
          {loading && !insights ? (
            <div className="animate-pulse space-y-3 mt-4">
                <div className="h-8 w-24 bg-gray-100 rounded"></div>
                <div className="h-4 w-full bg-gray-100 rounded"></div>
            </div>
          ) : (
            <div className="relative z-10 mt-4">
              <p className="text-4xl font-extrabold text-gray-900">{insights?.weather?.current || "Loading..."}</p>
              <p className="text-sm text-gray-500 mt-2 font-medium leading-relaxed">{insights?.weather?.forecast || "Updating forecast..."}</p>
            </div>
          )}
        </div>

        {/* Markets Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <svg className="w-32 h-32 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 relative z-10">Market Prices</h3>
          
          <div className="space-y-3 relative z-10">
            {selectedCommodities.map((item, index) => {
              const marketData = getMarketItem(item);
              return (
                <div key={index} className="flex justify-between items-center bg-gray-50/80 backdrop-blur-sm p-3 rounded-xl border border-gray-100 hover:border-green-200 transition-colors">
                  <select 
                    value={item}
                    onChange={(e) => handleCommodityChange(index, e.target.value)}
                    className="bg-transparent border-none text-gray-700 text-sm font-semibold focus:ring-0 cursor-pointer w-32 md:w-36 outline-none py-0 pl-0"
                    disabled={loading}
                  >
                    {COMMODITY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <div className="text-right">
                    <span className={`font-bold text-sm block ${loading ? 'text-gray-400' : 'text-green-700'}`}>
                      {loading ? '...' : (marketData?.price || '--')}
                    </span>
                    {!loading && marketData?.sourceUrl && (
                        <a href={marketData.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:text-blue-700 font-medium block truncate max-w-[80px] text-right ml-auto">
                            Source &rarr;
                        </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks Summary */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Pending Tasks</h3>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Today</span>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700 flex-1">Scout North Field</span>
              <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-md font-bold border border-red-100">HIGH</span>
            </li>
            <li className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700 flex-1">Check Pump #3</span>
              <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-1 rounded-md font-bold border border-yellow-100">MED</span>
            </li>
             <li className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700 flex-1">Order Feed</span>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold border border-blue-100">LOW</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Expert Insight / Daily Tip (Replaces Yield Chart) */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Expert Insight of the Day</h3>
        </div>

        {loading && !insights ? (
             <div className="animate-pulse space-y-4 max-w-2xl">
                <div className="h-8 w-3/4 bg-gray-100 rounded"></div>
                <div className="h-4 w-full bg-gray-100 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
            </div>
        ) : (
             <div className="flex flex-col md:flex-row gap-8 items-center">
                 <div className="flex-1">
                     {insights?.dailyTip ? (
                         <div className="space-y-4">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {insights.dailyTip.category || 'Farming Tip'}
                            </span>
                            <h4 className="text-2xl font-extrabold text-gray-900 leading-tight">
                                {insights.dailyTip.title}
                            </h4>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                {insights.dailyTip.content}
                            </p>
                         </div>
                     ) : (
                         <div className="space-y-4">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                                General Tip
                            </span>
                            <h4 className="text-2xl font-extrabold text-gray-900 leading-tight">
                                Monitor Soil Moisture Levels
                            </h4>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Consistent soil moisture monitoring is crucial during early crop stages. Use tensiometers or simple hand-feel tests to ensure roots are establishing well without waterlogging.
                            </p>
                         </div>
                     )}
                 </div>
                 
                 {/* Decorative Illustration/Icon */}
                 <div className="hidden md:flex flex-shrink-0 w-48 h-48 bg-gray-50 rounded-full items-center justify-center text-8xl border-4 border-white shadow-lg animate-fade-in">
                    💡
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};