import React, { useState, useEffect, useRef } from 'react';
import { Farmhand } from '../types';
import { backend } from '../services/mockBackend';

export const FarmhandManager: React.FC = () => {
  const [hands, setHands] = useState<Farmhand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHand, setSelectedHand] = useState<Farmhand | null>(null);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<Partial<Farmhand>>({
      name: '',
      role: 'General Labor',
      phone: '',
      email: '',
      status: 'Active',
      notes: '',
      startDate: new Date().toISOString().split('T')[0],
      imageUrl: '',
      coverUrl: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHands();
  }, []);

  const loadHands = async () => {
    setLoading(true);
    const data = await backend.getFarmhands();
    setHands(data);
    setLoading(false);
  };

  const handleSelectHand = (hand: Farmhand) => {
      setSelectedHand(hand);
      setForm(hand);
      setIsEditing(false);
  };

  const resetForm = () => {
      setForm({
        name: '',
        role: 'General Labor',
        phone: '',
        email: '',
        status: 'Active',
        notes: '',
        startDate: new Date().toISOString().split('T')[0],
        imageUrl: '',
        coverUrl: ''
      });
      setIsEditing(false);
      setEditingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      if(window.confirm(`Remove ${name} from farmhands?`)) {
          await backend.deleteFarmhand(id);
          loadHands();
          if (selectedHand?.id === id) setSelectedHand(null);
      }
  };

  const handleUpdate = async () => {
      if (!selectedHand) return;
      try {
          // If we are editing in detail view, 'form' holds the state
          const updated = await backend.updateFarmhand({ ...form, id: selectedHand.id } as Farmhand);
          setSelectedHand(updated);
          setIsEditing(false);
          loadHands();
      } catch (e) {
          alert("Failed to update farmhand");
      }
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
              setForm(prev => ({ ...prev, [field]: resizedBase64 }));
          } catch (error) {
              alert("Failed to process image.");
          }
      }
  };

  const handleSubmit = async () => {
      if (!form.name || !form.role) {
          alert("Name and Role are required.");
          return;
      }

      try {
          await backend.addFarmhand(form as any);
          setShowAddModal(false);
          resetForm();
          loadHands();
      } catch (e: any) {
          if (e.name === 'QuotaExceededError' || e.message?.includes('QuotaExceededError')) {
              alert("Storage full! Please delete old records or remove large images.");
          } else {
              alert("Failed to save farmhand.");
          }
      }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Active': return 'bg-green-100 text-green-700 border-green-200';
          case 'Seasonal': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'Inactive': return 'bg-gray-100 text-gray-600 border-gray-200';
          default: return 'bg-gray-50 text-gray-600 border-gray-200';
      }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div></div>;
  }

  // --- Detail View ---
  if (selectedHand) {
      // ... (Detail view implementation remains similar, already looks good, just fix close button in list view mainly)
      return (
        <div className="p-4 md:p-8 pb-32 md:pb-8 animate-fade-in">
            <button 
                onClick={() => setSelectedHand(null)}
                className="mb-6 group flex items-center text-gray-500 hover:text-green-700 font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-green-50 w-fit"
            >
                <div className="bg-white p-2 rounded-full shadow-sm mr-2 group-hover:bg-green-50 transition-colors">
                    <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </div>
                Back to Team
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
                                  setForm(selectedHand);
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
                             {(isEditing && form?.coverUrl) || (!isEditing && selectedHand.coverUrl) ? (
                                <img 
                                    src={isEditing ? form?.coverUrl : selectedHand.coverUrl} 
                                    alt="Cover" 
                                    className="w-full h-full object-cover"
                                />
                             ) : (
                                <div className="w-full h-full bg-gradient-to-b from-blue-50 to-blue-100/50"></div>
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
                                {(isEditing && form?.imageUrl) || (!isEditing && selectedHand.imageUrl) ? (
                                    <img 
                                        src={isEditing ? form?.imageUrl : selectedHand.imageUrl} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span>🧑‍🌾</span>
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
                                    value={form?.name}
                                    onChange={(e) => setForm(prev => ({...prev, name: e.target.value}))}
                                    className="text-2xl font-bold text-gray-900 text-center bg-white border border-gray-300 rounded-lg px-3 py-1 w-full mb-2 focus:ring-2 focus:ring-green-500 outline-none"
                                />
                            ) : (
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-1">{selectedHand.name}</h2>
                            )}

                            <p className="text-gray-400 font-mono text-xs mb-3">{selectedHand.role}</p>
                            
                            {isEditing ? (
                                <select 
                                    value={form?.status}
                                    onChange={(e) => setForm(prev => ({...prev, status: e.target.value as any}))}
                                    className="mt-2 text-sm font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 outline-none"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Seasonal">Seasonal</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            ) : (
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm ${getStatusColor(selectedHand.status)}`}>
                                    {selectedHand.status}
                                </span>
                            )}
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Phone</span>
                                    {isEditing ? (
                                        <input 
                                            value={form?.phone}
                                            onChange={(e) => setForm(prev => ({...prev, phone: e.target.value}))}
                                            className="w-full text-sm text-gray-900 border border-gray-300 rounded px-2 py-1" 
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-semibold">{selectedHand.phone || 'N/A'}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Email</span>
                                    {isEditing ? (
                                        <input 
                                            value={form?.email}
                                            onChange={(e) => setForm(prev => ({...prev, email: e.target.value}))}
                                            className="w-full text-sm text-gray-900 border border-gray-300 rounded px-2 py-1" 
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-semibold">{selectedHand.email || 'N/A'}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Start Date</span>
                                    {isEditing ? (
                                        <input 
                                            type="date"
                                            value={form?.startDate}
                                            onChange={(e) => setForm(prev => ({...prev, startDate: e.target.value}))}
                                            className="w-full text-sm text-gray-900 border border-gray-300 rounded px-2 py-1" 
                                        />
                                    ) : (
                                        <p className="text-gray-800 font-semibold">{new Date(selectedHand.startDate).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>
                            
                            {isEditing && (
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button 
                                        onClick={() => { setIsEditing(false); setForm(selectedHand); }}
                                        className="flex-1 bg-gray-100 text-gray-700 text-sm font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleUpdate}
                                        className="flex-1 bg-green-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-md"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Details/Notes */}
                <div className="lg:w-2/3">
                    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-8 min-h-[500px]">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Notes & History</h3>
                        
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-6">
                            <span className="text-xs text-yellow-800 uppercase font-bold tracking-wider block mb-2">General Notes</span>
                            {isEditing ? (
                                <textarea 
                                    value={form?.notes}
                                    onChange={(e) => setForm(prev => ({...prev, notes: e.target.value}))}
                                    className="w-full text-sm text-gray-800 bg-white border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                    rows={4}
                                />
                            ) : (
                                <p className="text-gray-700 leading-relaxed text-sm">
                                    {selectedHand.notes || "No additional notes."}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                             {selectedHand.phone && (
                                <a href={`tel:${selectedHand.phone}`} className="flex-1 bg-green-50 text-green-700 font-bold py-3 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    Call Now
                                </a>
                             )}
                             {selectedHand.email && (
                                <a href={`mailto:${selectedHand.email}`} className="flex-1 bg-blue-50 text-blue-700 font-bold py-3 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    Send Email
                                </a>
                             )}
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
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Farmhands</h2>
                <p className="text-gray-500 font-medium mt-1">Manage your team and local contacts.</p>
            </div>
            <button 
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                Add Farmhand
            </button>
        </div>

        {/* Grid - Standardized to match Crop/Animal card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hands.map((hand) => (
                <div key={hand.id} onClick={() => handleSelectHand(hand)} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-green-200 transition-all cursor-pointer relative group duration-300 overflow-hidden">
                    
                    {/* Delete Button - Uniform Style */}
                    <button 
                        onClick={(e) => handleDelete(e, hand.id, hand.name)}
                        className="absolute top-2 right-2 p-2.5 bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all z-20 shadow-md border border-white/50"
                        title="Delete Farmhand"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    {/* Cover Image */}
                    <div className="h-32 bg-gray-100 relative">
                        {hand.coverUrl ? (
                            <img src={hand.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-50 to-blue-100/50"></div>
                        )}
                        <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center text-3xl overflow-hidden">
                            {hand.imageUrl ? (
                                <img src={hand.imageUrl} className="w-full h-full object-cover" alt={hand.name} />
                            ) : (
                                <span>🧑‍🌾</span>
                            )}
                        </div>
                    </div>

                    <div className="pt-10 px-6 pb-6">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">{hand.name}</h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm whitespace-nowrap ${getStatusColor(hand.status)}`}>
                                {hand.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium mb-4">{hand.role}</p>

                        <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-50">
                            <div>
                                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider block mb-0.5">Contact</span>
                                <span className="font-semibold text-gray-700 truncate block">{hand.phone || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider block mb-0.5">Started</span>
                                <span className="font-semibold text-gray-700">{new Date(hand.startDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {hands.length === 0 && (
             <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 mt-6">
                <div className="text-6xl mb-4 grayscale opacity-50">👥</div>
                <h3 className="text-xl font-bold text-gray-900">No farmhands added</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">Add team members to keep track of your local workforce contacts.</p>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="text-green-600 font-bold hover:underline"
                >
                    Add Team Member
                </button>
            </div>
        )}

        {/* Modal */}
        {showAddModal && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] m-4 flex flex-col relative">
                    {/* Glass Morphism Close */}
                    <button 
                        onClick={() => setShowAddModal(false)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-sm hover:bg-white/60 text-gray-600 transition-all z-10"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-800">Add Farmhand</h3>
                    </div>
                    
                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                        {/* ... Modal content ... */}
                        <div className="flex gap-4 justify-center mb-4">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all overflow-hidden relative group"
                            >
                                {form.imageUrl ? (
                                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center group-hover:scale-105 transition-transform">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Profile</span>
                                        <svg className="w-6 h-6 text-gray-300 mx-auto group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                            </div>
                            
                            <div 
                                onClick={() => coverInputRef.current?.click()}
                                className="w-32 h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all overflow-hidden relative group"
                            >
                                {form.coverUrl ? (
                                    <img src={form.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center group-hover:scale-105 transition-transform">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Cover</span>
                                        <svg className="w-6 h-6 text-gray-300 mx-auto group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                            </div>
                            
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'imageUrl')} />
                            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverUrl')} />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Full Name</label>
                                <input 
                                    type="text" 
                                    value={form.name}
                                    onChange={(e) => setForm({...form, name: e.target.value})}
                                    className="w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Role</label>
                                <select 
                                    value={form.role}
                                    onChange={(e) => setForm({...form, role: e.target.value})}
                                    className="w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                >
                                    <option value="General Labor">General Labor</option>
                                    <option value="Harvester">Harvester</option>
                                    <option value="Machine Operator">Machine Operator</option>
                                    <option value="Vet Tech">Vet Tech</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Specialist">Specialist</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Status</label>
                                <select 
                                    value={form.status}
                                    onChange={(e) => setForm({...form, status: e.target.value as any})}
                                    className="w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Seasonal">Seasonal</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Phone</label>
                                <input 
                                    type="tel" 
                                    value={form.phone}
                                    onChange={(e) => setForm({...form, phone: e.target.value})}
                                    className="w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                    placeholder="(555) 555-5555"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Email</label>
                                <input 
                                    type="email" 
                                    value={form.email}
                                    onChange={(e) => setForm({...form, email: e.target.value})}
                                    className="w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Notes</label>
                                <textarea 
                                    value={form.notes}
                                    onChange={(e) => setForm({...form, notes: e.target.value})}
                                    className="w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                    rows={2}
                                    placeholder="Additional details..."
                                />
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
                            onClick={handleSubmit}
                            className="px-6 py-2.5 bg-green-600 rounded-xl text-sm font-bold text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                        >
                            {isEditing ? 'Save Changes' : 'Add Farmhand'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};