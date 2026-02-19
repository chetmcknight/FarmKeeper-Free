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
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCrop = async () => {
      if (!editForm) return;
      try {
          const updated = await backend.updateCrop(editForm);
          setSelectedCrop(updated);
          setIsEditing(false);
          loadCrops();
      } catch (e) {
          console.error("Update failed", e);
          alert("Failed to update crop.");
      }
  };

  const calculateDays = (dateString: string) => {
    if (!dateString) return 0;
    const eventDate = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - eventDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Compress image helper
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
        alert("Please fill in required fields (Name, Plant Date).");
        return;
    }

    const days = calculateDays(newCrop.plantedDate);
    const ageText = days >= 0 ? `Growth Day ${days}` : 'Scheduled for future planting';

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
          status: (newCrop.status as any) || 'Healthy',
          area: newCrop.area || 'N/A',
          imageUrl: newCrop.imageUrl,
          coverUrl: newCrop.coverUrl,
          history: [
            {
              id: Date.now().toString(),
              date: new Date().toISOString().split('T')[0],
              type: 'Planting',
              title: 'Field Created',
              notes: `Initial entry. ${ageText}.`,
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
        alert("Failed to create crop. Storage might be full.");
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

  // --- Detail View ---
  if (selectedCrop) {
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
                                            className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded px-2 py-1" 
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
                                            className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded px-2 py-1" 
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
                                            className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded px-2 py-1" 
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
                            {/* History Add Button (Static for now as detailed in requirements, but UI present) */}
                            <button className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium shadow-sm transition-all hover:scale-105 active:scale-95 opacity-50 cursor-not-allowed">
                                + Add Event (Pro)
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
                                                            📦 {record.product} {record.quantity && `(${record.quantity})`}
                                                        </span>
                                                    )}
                                                    {record.technician && (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-700 font-medium shadow-sm">
                                                            👤 {record.technician}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getEventTypeColor(record.type)}`}>
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
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Field Manager</h2>
                <p className="text-gray-500 font-medium mt-1">Track crop growth and field history.</p>
            </div>
            <button 
                onClick={() => {
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
                    setShowAddModal(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Field
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crops.map((crop) => (
                <div key={crop.id} onClick={() => handleSelectCrop(crop)} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-green-200 transition-all cursor-pointer relative group duration-300 overflow-hidden">
                    {/* Delete Button */}
                    <button 
                        onClick={(e) => handleDeleteCrop(e, crop.id, crop.name)}
                        className="absolute top-3 right-3 p-2 bg-white/90 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10 shadow-sm"
                        title="Delete Field"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="h-32 bg-gray-100 relative">
                        {crop.coverUrl ? (
                            <img src={crop.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100" />
                        )}
                        <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center text-2xl overflow-hidden">
                            {crop.imageUrl ? (
                                <img src={crop.imageUrl} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <span>🌽</span>
                            )}
                        </div>
                    </div>

                    <div className="pt-10 pb-6 px-6">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors truncate pr-2">{crop.name}</h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm whitespace-nowrap ${getStatusColor(crop.status)}`}>
                                {crop.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium mb-4">{crop.variety || 'Unknown Variety'}</p>

                        <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-50">
                            <div>
                                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider block mb-0.5">Planted</span>
                                <span className="font-semibold text-gray-700">{new Date(crop.plantedDate).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider block mb-0.5">Growth</span>
                                <span className="font-semibold text-gray-700">{Math.abs(calculateDays(crop.plantedDate))} days</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {crops.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 mt-6">
                <div className="text-6xl mb-4 grayscale opacity-50">🌽</div>
                <h3 className="text-xl font-bold text-gray-900">No crops tracked</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">Add a field to start monitoring growth cycles and operations.</p>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="text-green-600 font-bold hover:underline"
                >
                    Add Your First Field
                </button>
            </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-800">Add New Field</h3>
                        <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                        <div className="flex gap-6 justify-center">
                             <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-20 h-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all overflow-hidden relative group"
                            >
                                {newCrop.imageUrl ? (
                                    <img src={newCrop.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center group-hover:scale-105 transition-transform">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Icon</span>
                                        <svg className="w-6 h-6 text-gray-300 mx-auto group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'imageUrl')} />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Field Name</label>
                                <input 
                                    type="text" 
                                    value={newCrop.name}
                                    onChange={(e) => setNewCrop({...newCrop, name: e.target.value})}
                                    placeholder="e.g. North Pasture Corn"
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-gray-400"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Variety</label>
                                <input 
                                    type="text" 
                                    value={newCrop.variety}
                                    onChange={(e) => setNewCrop({...newCrop, variety: e.target.value})}
                                    placeholder="e.g. Sweet Corn"
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-gray-400"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Area (Acres)</label>
                                <input 
                                    type="text" 
                                    value={newCrop.area}
                                    onChange={(e) => setNewCrop({...newCrop, area: e.target.value})}
                                    placeholder="e.g. 5.2"
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-gray-400"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Planted Date</label>
                                <input 
                                    type="date" 
                                    value={newCrop.plantedDate}
                                    onChange={(e) => setNewCrop({...newCrop, plantedDate: e.target.value})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Status</label>
                                <select 
                                    value={newCrop.status}
                                    onChange={(e) => setNewCrop({...newCrop, status: e.target.value as any})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                >
                                    <option value="Healthy">Healthy</option>
                                    <option value="Needs Attention">Needs Attention</option>
                                    <option value="Harvest Ready">Harvest Ready</option>
                                    <option value="Harvested">Harvested</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100 mt-auto">
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
                            Create Field
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};