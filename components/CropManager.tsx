import React, { useState, useEffect, useRef } from 'react';
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
      area: '',
      imageUrl: '',
      coverUrl: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);

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
          console.error("Update failed", e);
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

  // Compress image helper (reused logic)
  const compressImage = (file: File, maxWidth: number = 600): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'coverUrl', isEdit: boolean = false) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const resizedBase64 = await compressImage(file);
              if (isEdit) {
                  setEditForm(prev => prev ? { ...prev, [field]: resizedBase64 } : null);
              } else {
                  setNewCrop(prev => ({ ...prev, [field]: resizedBase64 }));
              }
          } catch (error) {
              console.error("Image processing error", error);
          }
      }
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
    
    try {
        await backend.addCrop({
          name: newCrop.name,
          variety: newCrop.variety || 'Unknown',
          plantedDate: newCrop.plantedDate,
          harvestDate: finalHarvestDate,
          status: newCrop.status as any || 'Healthy',
          area: newCrop.area || 'N/A',
          imageUrl: newCrop.imageUrl,
          coverUrl: newCrop.coverUrl,
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
          area: '',
          imageUrl: '',
          coverUrl: ''
        });
        loadCrops();
    } catch (e) {
        console.error("Create crop failed", e);
        // Suppress alert
    }
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

  // ... (Detail View Code - Unchanged logic, no inputs here to fix) ...
  // --- Detail View ---
  if (selectedCrop) {
    // Force sort descending (Newest first)
    const sortedHistory = [...selectedCrop.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="p-4 md:p-8 pb-32 md:pb-8 animate-fade-in">
            <button 
                onClick={() => setSelectedCrop(null)}
                className="mb-6 group flex items-center text-gray-500 hover:text-green-700 font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-green-50 w-fit"
            >
                <div className="bg-white p-2 rounded-full shadow-sm mr-2 group-hover:bg-green-50 transition-colors">
                    <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </div>
                Back to Field Overview
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Profile Card */}
                <div className="lg:w-1/3">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden relative">
                         {/* Edit Toggle Button */}
                         <button 
                          onClick={() => {
                              if (isEditing) {
                                  // Cancel action
                                  setIsEditing(false);
                                  setEditForm(selectedCrop);
                              } else {
                                  setIsEditing(true);
                              }
                          }}
                          className={`absolute top-4 right-4 z-20 p-2.5 rounded-full transition-all shadow-sm ${
                              isEditing ? 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600' : 'bg-white/80 backdrop-blur-sm text-gray-500 hover:bg-white hover:text-green-600'
                          }`}
                        >
                           {isEditing ? (
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                           ) : (
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                           )}
                        </button>

                        {/* Cover Image */}
                        <div className="h-32 bg-gray-100 relative">
                             {(isEditing && editForm?.coverUrl) || (!isEditing && selectedCrop.coverUrl) ? (
                                <img 
                                    src={isEditing ? editForm?.coverUrl : selectedCrop.coverUrl} 
                                    alt="Cover" 
                                    className="w-full h-full object-cover"
                                />
                             ) : (
                                <div className="w-full h-full bg-gradient-to-b from-green-50 to-green-100/50"></div>
                             )}
                             {isEditing && (
                                <button 
                                    onClick={() => editCoverInputRef.current?.click()}
                                    className="absolute top-2 left-2 bg-white/80 p-1.5 rounded-full text-gray-600 hover:text-green-600 text-xs font-bold shadow-sm"
                                >
                                    Change Poster
                                </button>
                             )}
                        </div>

                        <div className="bg-white p-8 pt-0 flex flex-col items-center border-b border-gray-50 relative">
                            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-5xl shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] mb-5 border-4 border-white -mt-14 overflow-hidden relative group">
                                {(isEditing && editForm?.imageUrl) || (!isEditing && selectedCrop.imageUrl) ? (
                                    <img 
                                        src={isEditing ? editForm?.imageUrl : selectedCrop.imageUrl} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span>🌽</span>
                                )}

                                {isEditing && (
                                    <div 
                                        onClick={() => editFileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                    </div>
                                )}
                            </div>

                            {/* Hidden Inputs for Edit */}
                            <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'imageUrl', true)} />
                            <input type="file" ref={editCoverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverUrl', true)} />
                            
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
                                    className="mt-2 text-sm font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 outline-none"
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
                                            className="w-full text-sm text-gray-900 border border-gray-300 rounded px-2 py-1" 
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
                                            className="w-full text-sm text-gray-900 border border-gray-300 rounded px-2 py-1" 
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
                                            className="w-full text-sm text-gray-900 border border-gray-300 rounded px-2 py-1" 
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
                                            className="w-full text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 bg-white" 
                                        />
                                    ) : (
                                        <p className="text-green-700 font-bold text-lg">{new Date(selectedCrop.harvestDate).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>
                            
                            {isEditing && (
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button 
                                        onClick={() => { setIsEditing(false); setEditForm(selectedCrop); }}
                                        className="flex-1 bg-gray-100 text-gray-700 text-sm font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleUpdateCrop}
                                        className="flex-1 bg-green-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-md"
                                    >
                                        Save Changes
                                    </button>
                                </div>
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
