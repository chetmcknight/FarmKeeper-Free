import React, { useState, useEffect, useRef } from 'react';
import { Farmhand } from '../types';
import { backend } from '../services/mockBackend';

export const FarmhandManager: React.FC = () => {
  const [hands, setHands] = useState<Farmhand[]>([]);
  const [loading, setLoading] = useState(true);
  
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
      imageUrl: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHands();
  }, []);

  const loadHands = async () => {
    setLoading(true);
    const data = await backend.getFarmhands();
    setHands(data);
    setLoading(false);
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
        imageUrl: ''
      });
      setIsEditing(false);
      setEditingId(null);
  };

  const handleEdit = (hand: Farmhand) => {
      setForm(hand);
      setEditingId(hand.id);
      setIsEditing(true);
      setShowAddModal(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      if(window.confirm(`Remove ${name} from farmhands?`)) {
          await backend.deleteFarmhand(id);
          loadHands();
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const resizedBase64 = await compressImage(file);
              setForm(prev => ({ ...prev, imageUrl: resizedBase64 }));
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
          if (isEditing && editingId) {
              await backend.updateFarmhand({ ...form, id: editingId } as Farmhand);
          } else {
              await backend.addFarmhand(form as any);
          }
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hands.map((hand) => (
                <div key={hand.id} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-all relative group overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-200"></div>
                    
                    <div className="px-6 relative">
                        <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-md -mt-10 overflow-hidden flex items-center justify-center text-3xl">
                            {hand.imageUrl ? (
                                <img src={hand.imageUrl} className="w-full h-full object-cover" alt={hand.name} />
                            ) : (
                                <span>🧑‍🌾</span>
                            )}
                        </div>
                        
                        <div className="absolute top-2 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEdit(hand)} className="text-gray-400 hover:text-green-600 bg-white/80 p-1.5 rounded-full shadow-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             </button>
                             <button onClick={(e) => handleDelete(e, hand.id, hand.name)} className="text-gray-400 hover:text-red-600 bg-white/80 p-1.5 rounded-full shadow-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                        </div>
                    </div>

                    <div className="p-6 pt-2">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="text-xl font-bold text-gray-900">{hand.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(hand.status)}`}>
                                {hand.status}
                            </span>
                        </div>
                        <p className="text-sm text-green-600 font-semibold mb-4">{hand.role}</p>

                        <div className="space-y-3 text-sm text-gray-600">
                            {hand.phone && (
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    {hand.phone}
                                </div>
                            )}
                            {hand.email && (
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <span className="truncate">{hand.email}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50 flex gap-2">
                            <a href={`tel:${hand.phone}`} className="flex-1 text-center py-2 rounded-lg bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-700 font-bold text-xs transition-colors">
                                Call
                            </a>
                            <a href={`mailto:${hand.email}`} className="flex-1 text-center py-2 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-700 font-bold text-xs transition-colors">
                                Email
                            </a>
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
            <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] m-4 flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-800">{isEditing ? 'Edit Farmhand' : 'Add Farmhand'}</h3>
                        <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                        <div className="flex justify-center mb-4">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all overflow-hidden relative group"
                            >
                                {form.imageUrl ? (
                                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center group-hover:scale-105 transition-transform">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Photo</span>
                                        <svg className="w-6 h-6 text-gray-300 mx-auto group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
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