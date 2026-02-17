import React, { useState, useEffect } from 'react';
import { Crop, FieldRecord } from '../types';
import { backend } from '../services/mockBackend';

export const CropManager: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Crop | null>(null);

  // Add State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCrop, setNewCrop] = useState<Partial<Crop>>({
      name: '',
      variety: '',
      plantedDate: new Date().toISOString().split('T')[0],
      harvestDate: '',
      status: 'Healthy',
      area: ''
  });

  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = async () => {
    setLoading(true);
    const data = await backend.getCrops();
    setCrops(data);
    setLoading(false);
  };

  const handleSelectCrop = (crop: Crop) => {
      setSelectedCrop(crop);
      setEditForm(crop);
      setIsEditing(false);
  };

  const handleUpdateCrop = async () => {
      if (!editForm) return;
      try {
          await backend.updateCrop(editForm);
          setSelectedCrop(editForm);
          setIsEditing(false);
          loadCrops();
      } catch (e) {
          alert("Failed to update crop");
      }
  };

  const calculateDays = (dateString: string) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    // Using simple difference
    const diffTime = now.getTime() - eventDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleCreateCrop = async () => {
    if (!newCrop.name || !newCrop.plantedDate) {
        alert("Please fill in required fields.");
        return;
    }

    // Calculate growth days for context
    const days = calculateDays(newCrop.plantedDate);
    const ageText = days >= 0 ? `Growth Day ${days}` : 'Scheduled for future planting';

    // Estimate harvest if not set (e.g., +90 days)
    let finalHarvestDate = newCrop.harvestDate;
    if (!finalHarvestDate) {
         const d = new Date(newCrop.plantedDate);
         d.setDate(d.getDate() + 90);
         finalHarvestDate = d.toISOString().split('T')[0];
    }
    
    await backend.addCrop({
      name: newCrop.name,
      variety: newCrop.variety || 'Unknown',
      plantedDate: newCrop.plantedDate,
      harvestDate: finalHarvestDate,
      status: newCrop.status as any || 'Healthy',
      area: newCrop.area || 'N/A',
      history: [
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0], // Created record date is today
          type: 'Planting',
          title: 'Field Created',
          notes: `Initial entry. ${ageText}.`, // <--- Added Age info here
          technician: 'System'
        }
      ]
    });
    
    setShowAddModal(false);
    setNewCrop({
      name: '',
      variety: '',
      plantedDate: new Date().toISOString().split('T')[0],
      harvestDate: '',
      status: 'Healthy',
      area: ''
    });
    loadCrops();
  };
  
  const handleDeleteCrop = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await backend.deleteCrop(id);
      loadCrops();
      if (selectedCrop?.id === id) {
        setSelectedCrop(null);
      }
    }
  };

  const getStatusColor = (status: Crop['status']) => {
    switch (status) {
      case 'Healthy': return 'bg-green-100 text-green-700 border-green-200';
      case 'Needs Attention': return 'bg-red-100 text-red-700 border-red-200';
      case 'Harvest Ready': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Harvested': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEventTypeColor = (type: FieldRecord['type']) => {
    switch (type) {
        case 'Planting': return 'bg-green-100 text-green-700 border-green-200';
        case 'Harvest': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'Spraying': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'Fertilizer': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Scouting': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'Irrigation': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
     return <div className="min-h-[50vh] flex justify-center items-center"><div className="animate-spin h-10 w-10 border-4 border-green-500 rounded-full border-t-transparent"></div></div>;
  }

  // --- Detail View ---
  if (selectedCrop) {
    const sortedHistory = [...selectedCrop.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="p-4 md:p-8 pb-32 md:pb-8 animate-fade-in">
            <button 
                onClick={() => setSelectedCrop(null)}
                className="mb-6 group flex items-center text-gray-500 hover:text-green-700 font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-green-50 w-fit"
            >
                <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Field Overview
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Profile Card */}
                <div className="lg:w-1/3">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden relative">
                         {/* Edit Toggle Button */}
                         <button 
                          onClick={() => isEditing ? handleUpdateCrop() : setIsEditing(true)}
                          className={`absolute top-4 right-4 z-20 p-2.5 rounded-full transition-all shadow-sm ${
                              isEditing ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' : 'bg-white/80 backdrop-blur-sm text-gray-500 hover:bg-white hover:text-green-600'
                          }`}
                        >
                           {isEditing ? (
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                           ) : (
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                           )}
                        </button>

                        <div className="bg-gradient-to-b from-green-50 to-white p-8 flex flex-col items-center border-b border-gray-50 pt-16 relative">
                            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-5xl shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] mb-5 border-4 border-white">
                                🌽
                            </div>
                            
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    value={editForm?.name}
                                    onChange={(e) => setEditForm(prev => prev ? {...prev, name: e.target.value} : null)}
                                    className="text-2xl font-bold text-gray-900 text-center bg-white border border-gray-300 rounded-lg px-3 py-1 w-full mb-2 focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            ) : (
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-1">{selectedCrop.name}</h2>
                            )}

                            <p className="text-gray-400 font-mono text-xs mb-3">{selectedCrop.id.slice(-8)}</p>
                            
                            {isEditing ? (
                                <select 
                                    value={editForm?.status}
                                    onChange={(e) => setEditForm(prev => prev ? {...prev, status: e.target.value as any} : null)}
                                    className="mt-2 text-sm font-bold bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 outline-none"
                                >
                                    <option value="Healthy">Healthy</option>
                                    <option value="Needs Attention">Needs Attention</option>
                                    <option value="Harvest Ready">Harvest Ready</option>
                                    <option value="Harvested">Harvested</option>
                                </select>
                            ) : (
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm ${getStatusColor(selectedCrop.status)}`}>
                                    {selectedCrop.status}
                                </span>
                            )}
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Variety</span>
                                    {isEditing ? (
                                        <input 
                                            value={editForm?.variety}
                                            onChange={(e) => setEditForm(prev => prev ? {...prev, variety: e.target.value} : null)}
                                            className="w-full text-sm border border-gray-300 rounded px-2 py-1" 
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-semibold">{selectedCrop.variety}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Area</span>
                                    {isEditing ? (
                                        <input 
                                            value={editForm?.area}
                                            onChange={(e) => setEditForm(prev => prev ? {...prev, area: e.target.value} : null)}
                                            className="w-full text-sm border border-gray-300 rounded px-2 py-1" 
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-semibold">{selectedCrop.area}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Planted</span>
                                    {isEditing ? (
                                        <input 
                                            type="date"
                                            value={editForm?.plantedDate}
                                            onChange={(e) => setEditForm(prev => prev ? {...prev, plantedDate: e.target.value} : null)}
                                            className="w-full text-sm border border-gray-300 rounded px-2 py-1" 
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-semibold">{new Date(selectedCrop.plantedDate).toLocaleDateString()}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Growth</span>
                                    <p className="text-gray-800 font-semibold">
                                        {Math.abs(calculateDays(isEditing && editForm ? editForm.plantedDate : selectedCrop.plantedDate))} days
                                    </p>
                                </div>
                                <div className="col-span-2 bg-green-50/50 p-4 rounded-xl border border-green-100">
                                    <span className="text-xs text-green-700 uppercase font-bold tracking-wider block mb-1">Est. Harvest</span>
                                    {isEditing ? (
                                        <input 
                                            type="date"
                                            value={editForm?.harvestDate}
                                            onChange={(e) => setEditForm(prev => prev ? {...prev, harvestDate: e.target.value} : null)}
                                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white" 
                                        />
                                    ) : (
                                        <p className="text-green-700 font-bold text-lg">{new Date(selectedCrop.harvestDate).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>
                            {isEditing && (
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    className="w-full mt-2 bg-gray-100 text-gray-600 text-sm font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel Changes
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Timeline / Operations History */}
                <div className="lg:w-2/3">
                    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-8 min-h-[500px]">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-gray-900">Field Operations</h3>
                            <button className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium shadow-sm transition-all hover:scale-105 active:scale-95">
                                + Add Event
                            </button>
                        </div>

                        <div className="relative border-l-2 border-gray-100 ml-3.5 space-y-10">
                            {sortedHistory.map((record) => (
                                <div key={record.id} className="relative pl-8 group">
                                    <div className={`absolute -left-[9px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10 ${
                                        record.type === 'Planting' ? 'bg-green-500' :
                                        record.type === 'Spraying' ? 'bg-purple-500' :
                                        record.type === 'Harvest' ? 'bg-amber-500' :
                                        'bg-gray-400'
                                    }`}></div>
                                    
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                        <div>
                                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wide block mb-1">
                                                {new Date(record.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                            <h4 className="text-lg font-bold text-gray-800 mb-1">{record.title}</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed">{record.notes}</p>
                                            
                                            {(record.technician || record.product) && (
                                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                    {record.product && (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-700 font-medium shadow-sm">
                                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                                            {record.product} {record.quantity && <span className="text-gray-400">({record.quantity})</span>}
                                                        </span>
                                                    )}
                                                    {record.technician && (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-700 font-medium shadow-sm">
                                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                            {record.technician}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${getEventTypeColor(record.type)}`}>
                                                {record.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // --- List View ---
  return (
    <div className="p-4 md:p-8 pb-32 md:pb-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Crops</h2>
            <p className="text-gray-500 font-medium mt-1">Manage your fields and harvest schedules.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Crop
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {crops.map((crop) => (
          <div key={crop.id} onClick={() => handleSelectCrop(crop)} className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-green-200 transition-all cursor-pointer relative group duration-300">
            
            {/* Delete Button */}
            <button 
                onClick={(e) => handleDeleteCrop(e, crop.id, crop.name)}
                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10 scale-90 hover:scale-100"
                title="Delete Crop"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">{crop.name}</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">{crop.variety}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getStatusColor(crop.status)}`}>
                {crop.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Planted</span>
                <span className="font-semibold text-gray-700">{new Date(crop.plantedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Est. Harvest</span>
                <span className="font-semibold text-gray-700">{new Date(crop.harvestDate).toLocaleDateString()}</span>
              </div>
               <div className="flex flex-col">
                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Area</span>
                <span className="font-semibold text-gray-700">{crop.area}</span>
              </div>
               <div className="flex flex-col">
                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Last Activity</span>
                <span className="font-semibold text-gray-700 truncate bg-gray-50 px-2 py-0.5 rounded-md -ml-2">
                    {crop.history && crop.history.length > 0 ? crop.history[crop.history.length -1].type : 'None'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
               <span className="text-green-600 group-hover:text-green-700 text-sm font-bold flex items-center gap-1 transition-colors">
                 View Details <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
               </span>
            </div>
          </div>
        ))}
      </div>

       {/* Add Crop Modal */}
       {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-gray-800">Add New Crop</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Field Name</label>
                            <input 
                                type="text" 
                                placeholder="e.g. North Pasture"
                                value={newCrop.name}
                                onChange={(e) => setNewCrop({...newCrop, name: e.target.value})}
                                className="w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-gray-400"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Variety/Crop</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Corn"
                                value={newCrop.variety}
                                onChange={(e) => setNewCrop({...newCrop, variety: e.target.value})}
                                className="w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-gray-400"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Area/Size</label>
                            <input 
                                type="text" 
                                placeholder="e.g. 50 Acres"
                                value={newCrop.area}
                                onChange={(e) => setNewCrop({...newCrop, area: e.target.value})}
                                className="w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-gray-400"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Date Planted</label>
                            <input 
                                type="date" 
                                value={newCrop.plantedDate}
                                onChange={(e) => setNewCrop({...newCrop, plantedDate: e.target.value})}
                                className="w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-600"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Status</label>
                            <select 
                                value={newCrop.status}
                                onChange={(e) => setNewCrop({...newCrop, status: e.target.value as any})}
                                className="w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                            >
                                <option value="Healthy">Healthy</option>
                                <option value="Needs Attention">Needs Attention</option>
                                <option value="Harvest Ready">Harvest Ready</option>
                                <option value="Harvested">Harvested</option>
                            </select>
                        </div>
                         <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Est. Harvest Date (Optional)</label>
                            <input 
                                type="date" 
                                value={newCrop.harvestDate}
                                onChange={(e) => setNewCrop({...newCrop, harvestDate: e.target.value})}
                                className="w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-600"
                            />
                        </div>
                    </div>
                </div>
                <div className="px-8 py-6 bg-gray-50 flex justify-end gap-3 sticky bottom-0 z-10 border-t border-gray-100">
                    <button 
                        onClick={() => setShowAddModal(false)}
                        className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleCreateCrop}
                        disabled={!newCrop.name}
                        className="px-6 py-2.5 bg-green-600 rounded-xl text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                    >
                        Add Crop
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};