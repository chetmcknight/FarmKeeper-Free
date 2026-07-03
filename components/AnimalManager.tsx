import React, { useState, useEffect, useRef } from 'react';
import { Animal, MedicalRecord } from '../types';
import { backend } from '../services/mockBackend';

export const AnimalManager: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Animal | null>(null);

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  
  const [newAnimal, setNewAnimal] = useState<Partial<Animal>>({
      name: '',
      type: 'Cattle',
      breed: '',
      birthDate: new Date().toISOString().split('T')[0],
      gender: 'Female',
      status: 'Healthy',
      weight: '',
      imageUrl: '',
      coverUrl: ''
  });

  const [recordForm, setRecordForm] = useState<Partial<MedicalRecord>>({
    type: 'Checkup',
    date: new Date().toISOString().split('T')[0],
    title: '',
    notes: ''
  });

  const fileInputRefProfile = useRef<HTMLInputElement>(null);
  const fileInputRefCover = useRef<HTMLInputElement>(null);
  const addFileInputRefProfile = useRef<HTMLInputElement>(null);
  const addFileInputRefCover = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadAnimals();
  }, []);

  const loadAnimals = async () => {
    setLoading(true);
    try {
      const data = await backend.getAnimals();
      setAnimals(data);
    } catch (e) {
      console.error("Failed to load animals", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setEditForm(animal);
    setIsEditing(false);
  };

  const handleDeleteAnimal = async (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      if(window.confirm(`Are you sure you want to delete ${name}?`)) {
          await backend.deleteAnimal(id);
          loadAnimals();
          if(selectedAnimal?.id === id) {
              setSelectedAnimal(null);
          }
      }
  };

  const compressImage = (file: File, maxWidth: number = 800): Promise<string> => {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'coverUrl', isAddMode: boolean = false) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const resizedBase64 = await compressImage(file, 600);
              
              if (isAddMode) {
                  setNewAnimal(prev => ({ ...prev, [field]: resizedBase64 }));
              } else {
                  setEditForm(prev => prev ? { ...prev, [field]: resizedBase64 } : null);
              }
          } catch (error) {
              console.error("Image processing failed", error);
          }
      }
  };

  const handleUpdateProfile = async () => {
    if (!editForm) return;
    try {
        await backend.updateAnimal(editForm);
        setSelectedAnimal(editForm);
        setIsEditing(false);
        loadAnimals();
    } catch (e: any) {
        console.error("Update failed", e);
    }
  };

  const openAddRecordModal = () => {
      setRecordForm({
        type: 'Checkup',
        date: today,
        title: '',
        notes: '',
        veterinarian: '',
        cost: '',
        treatment: ''
      });
      setEditingRecordId(null);
      setShowRecordModal(true);
  };

  const openEditRecordModal = (record: MedicalRecord) => {
      setRecordForm({
          date: record.date,
          type: record.type,
          title: record.title,
          notes: record.notes,
          veterinarian: record.veterinarian || '',
          treatment: record.treatment || '',
          cost: record.cost || ''
      });
      setEditingRecordId(record.id);
      setShowRecordModal(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
      if (!selectedAnimal) return;
      if (!window.confirm("Are you sure you want to delete this record?")) return;

      const updatedHistory = selectedAnimal.medicalHistory.filter(r => r.id !== recordId);
      const updatedAnimal = { ...selectedAnimal, medicalHistory: updatedHistory };

      try {
          await backend.updateAnimal(updatedAnimal);
          setSelectedAnimal(updatedAnimal);
          loadAnimals();
      } catch(e) {
          console.error(e);
      }
  };

  const handleSaveRecord = async () => {
    if (!selectedAnimal || !recordForm.title) return;

    let updatedHistory = [...selectedAnimal.medicalHistory];

    if (editingRecordId) {
        updatedHistory = updatedHistory.map(r => r.id === editingRecordId ? {
            ...r,
            date: recordForm.date!,
            type: recordForm.type as any,
            title: recordForm.title!,
            notes: recordForm.notes || '',
            veterinarian: recordForm.veterinarian,
            treatment: recordForm.treatment,
            cost: recordForm.cost
        } : r);
    } else {
        const newRecord: MedicalRecord = {
            id: Date.now().toString(),
            date: recordForm.date!,
            type: recordForm.type as any,
            title: recordForm.title!,
            notes: recordForm.notes || '',
            veterinarian: recordForm.veterinarian,
            treatment: recordForm.treatment,
            cost: recordForm.cost
        };
        updatedHistory.push(newRecord);
    }

    const updatedAnimal = {
        ...selectedAnimal,
        medicalHistory: updatedHistory
    };

    try {
        await backend.updateAnimal(updatedAnimal);
        setSelectedAnimal(updatedAnimal);
        setShowRecordModal(false);
        setEditingRecordId(null);
        loadAnimals();
    } catch (e) {
        console.error("Save failed", e);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '--';
    const birth = new Date(birthDate);
    const now = new Date();
    
    if (isNaN(birth.getTime())) return '--';
    if (birth > now) return 'Not born yet';

    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mos`;
    return `${Math.floor(diffDays / 365)} yrs`;
  };

  const handleCreateAnimal = async () => {
      if (!newAnimal.name || !newAnimal.type) {
          alert("Please fill in required fields.");
          return;
      }
      
      const ageString = calculateAge(newAnimal.birthDate || today);

      try {
          await backend.addAnimal({
              ...newAnimal as any,
              medicalHistory: [
                  {
                      id: Date.now().toString(),
                      date: today,
                      type: 'General',
                      title: 'Acquired',
                      notes: `Added to inventory. Age: ${ageString}.`,
                      caretaker: 'System'
                  }
              ]
          });
          setShowAddModal(false);
          setNewAnimal({
              name: '',
              type: 'Cattle',
              breed: '',
              birthDate: today,
              gender: 'Female',
              status: 'Healthy',
              weight: '',
              imageUrl: '',
              coverUrl: ''
          });
          loadAnimals();
      } catch (e: any) {
          console.error(e);
          if (e.name === 'QuotaExceededError' || e.message?.includes('QuotaExceededError')) {
              alert("Storage full! Please delete old records or remove large images.");
          } else {
              alert("Failed to save animal. Try again.");
          }
      }
  };

  const getAnimalIcon = (type: string) => {
      switch (type) {
          case 'Cattle': return '🐄';
          case 'Pig': return '🐖';
          case 'Chicken': return '🐓';
          case 'Sheep': return '🐑';
          case 'Goat': return '🐐';
          case 'Horse': return '🐎';
          case 'Dog': return '🐕';
          case 'Llama': return '🦙';
          case 'Donkey': return '🫏';
          case 'Cat': 
          case 'Kitten': return '🐈';
          default: return '🐾';
      }
  };

  const getStatusColor = (status: Animal['status']) => {
    switch (status) {
      case 'Healthy': return 'bg-green-100 text-green-700 border-green-200';
      case 'Lactating': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pregnant': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Vet Check Required': return 'bg-red-100 text-red-700 border-red-200';
      case 'Sick': return 'bg-red-100 text-red-700 border-red-200';
      case 'Deceased': return 'bg-gray-200 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEventTypeColor = (type: MedicalRecord['type']) => {
      switch (type) {
          case 'Vaccination': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'Illness': return 'bg-red-100 text-red-700 border-red-200';
          case 'Injury': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'Checkup': return 'bg-green-100 text-green-700 border-green-200';
          case 'Surgery': return 'bg-purple-100 text-purple-700 border-purple-200';
          default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div></div>;
  }

  if (selectedAnimal) {
    const upcomingEvents = selectedAnimal.medicalHistory
        .filter(r => r.date > today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
    const pastEvents = selectedAnimal.medicalHistory
        .filter(r => r.date <= today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="p-6 md:p-10 animate-fade-in">
            <button 
                onClick={() => setSelectedAnimal(null)}
                className="mb-6 flex items-center text-gray-500 hover:text-green-600 font-medium transition-colors w-fit group"
            >
                <div className="bg-white p-2 rounded-full shadow-sm mr-2 group-hover:bg-green-50 transition-colors">
                    <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </div>
                Back to Livestock
            </button>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                        <div className="h-32 bg-green-50 relative overflow-hidden">
                             {(isEditing && editForm?.coverUrl) || (!isEditing && selectedAnimal.coverUrl) ? (
                                <img 
                                    src={isEditing ? editForm?.coverUrl : selectedAnimal.coverUrl} 
                                    alt="Cover" 
                                    className="w-full h-full object-cover"
                                />
                             ) : (
                                <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100"></div>
                             )}
                             {isEditing && (
                                <div 
                                    onClick={() => fileInputRefCover.current?.click()}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 cursor-pointer transition-opacity group"
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                        <span className="text-xs font-bold">Change Poster</span>
                                    </div>
                                </div>
                             )}
                        </div>

                        <button 
                          onClick={() => {
                              if (isEditing) {
                                  setIsEditing(false);
                                  setEditForm(selectedAnimal);
                              } else {
                                  setIsEditing(true);
                              }
                          }}
                          className={`absolute top-4 right-4 z-20 p-2 rounded-full transition-colors shadow-sm ${
                              isEditing ? 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600' : 'bg-white/90 text-gray-500 hover:bg-white hover:text-green-600'
                          }`}
                        >
                           {isEditing ? (
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                           ) : (
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                           )}
                        </button>
                        
                        <input type="file" ref={fileInputRefProfile} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={(e) => handleImageUpload(e, 'imageUrl')} />
                        <input type="file" ref={fileInputRefCover} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={(e) => handleImageUpload(e, 'coverUrl')} />

                        <div className="px-6 pb-6 -mt-12 relative z-10 flex flex-col items-center">
                            <div className="w-24 h-24 bg-white rounded-full border-4 border-white flex items-center justify-center text-4xl shadow-md mb-3 overflow-hidden relative group">
                                {(isEditing && editForm?.imageUrl) || (!isEditing && selectedAnimal.imageUrl) ? (
                                    <img 
                                        src={isEditing ? editForm?.imageUrl : selectedAnimal.imageUrl} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    getAnimalIcon(isEditing && editForm ? editForm.type : selectedAnimal.type)
                                )}
                                
                                {isEditing && (
                                    <div 
                                        onClick={() => fileInputRefProfile.current?.click()}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                    </div>
                                )}
                            </div>
                            
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    value={editForm?.name}
                                    onChange={(e) => setEditForm(prev => prev ? {...prev, name: e.target.value} : null)}
                                    className="text-2xl font-bold text-gray-900 text-center bg-white border border-gray-300 rounded px-2 py-1 w-full mb-1"
                                />
                            ) : (
                                <h2 className="text-2xl font-bold text-gray-900">{selectedAnimal.name}</h2>
                            )}
                            
                            {isEditing ? (
                                <select 
                                    value={editForm?.status}
                                    onChange={(e) => setEditForm(prev => prev ? {...prev, status: e.target.value as any} : null)}
                                    className="mt-2 text-xs font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                                >
                                    <option value="Healthy">Healthy</option>
                                    <option value="Sick">Sick</option>
                                    <option value="Vet Check Required">Vet Check Required</option>
                                    <option value="Pregnant">Pregnant</option>
                                    <option value="Lactating">Lactating</option>
                                    <option value="Deceased">Deceased</option>
                                </select>
                            ) : (
                                <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedAnimal.status)}`}>
                                    {selectedAnimal.status}
                                </span>
                            )}
                        </div>
                        <div className="px-6 pb-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Breed</span>
                                    {isEditing ? (
                                        <input 
                                            value={editForm?.breed}
                                            onChange={(e) => setEditForm(prev => prev ? {...prev, breed: e.target.value} : null)}
                                            className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded px-2 py-1" 
                                        />
                                    ) : (
                                        <p onClick={() => setIsEditing(true)} className="text-gray-700 font-medium cursor-pointer hover:text-green-600">{selectedAnimal.breed}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Type</span>
                                    {isEditing ? (
                                        <select 
                                            value={editForm?.type}
                                            onChange={(e) => setEditForm(prev => prev ? {...prev, type: e.target.value} : null)}
                                            className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded px-2 py-1" 
                                        >
                                            <option value="Cattle">Cattle</option>
                                            <option value="Pig">Pig</option>
                                            <option value="Sheep">Sheep</option>
                                            <option value="Chicken">Chicken</option>
                                            <option value="Goat">Goat</option>
                                            <option value="Horse">Horse</option>
                                            <option value="Dog">Dog</option>
                                            <option value="Llama">Llama</option>
                                            <option value="Donkey">Donkey</option>
                                            <option value="Cat">Cat/Kitten</option>
                                        </select>
                                    ) : (
                                        <p className="text-gray-700 font-medium">{selectedAnimal.type}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Gender</span>
                                    {isEditing ? (
                                         <select 
                                            value={editForm?.gender}
                                            onChange={(e) => setEditForm(prev => prev ? {...prev, gender: e.target.value as any} : null)}
                                            className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded px-2 py-1" 
                                        >
                                            <option value="Female">Female</option>
                                            <option value="Male">Male</option>
                                        </select>
                                    ) : (
                                        <p className="text-gray-700 font-medium">{selectedAnimal.gender}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Current Weight</span>
                                     {isEditing ? (
                                        <input 
                                            value={editForm?.weight}
                                            onChange={(e) => setEditForm(prev => prev ? {...prev, weight: e.target.value} : null)}
                                            className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded px-2 py-1" 
                                        />
                                    ) : (
                                        <p onClick={() => setIsEditing(true)} className="text-gray-700 font-medium cursor-pointer hover:text-green-600">{selectedAnimal.weight}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Born</span>
                                    {isEditing ? (
                                        <input 
                                            type="date"
                                            value={editForm?.birthDate}
                                            onChange={(e) => setEditForm(prev => prev ? {...prev, birthDate: e.target.value} : null)}
                                            className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded px-2 py-1" 
                                        />
                                    ) : (
                                        <p className="text-gray-700 font-medium">{new Date(selectedAnimal.birthDate).toLocaleDateString()}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Age</span>
                                    <p className="text-gray-700 font-medium">
                                        {calculateAge(isEditing && editForm ? editForm.birthDate : selectedAnimal.birthDate)}
                                    </p>
                                </div>
                            </div>
                            
                            {isEditing && (
                                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
                                    <button 
                                        onClick={() => { setIsEditing(false); setEditForm(selectedAnimal); }}
                                        className="flex-1 bg-gray-100 text-gray-700 text-sm font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleUpdateProfile}
                                        className="flex-1 bg-green-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-md"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:w-2/3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Care Timeline</h3>
                            <button 
                                onClick={openAddRecordModal}
                                className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 font-medium flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add Record
                            </button>
                        </div>
                        
                        <div className="space-y-8">
                            {upcomingEvents.length > 0 && (
                                <div className="mb-8 border-b border-gray-100 pb-6">
                                     <h4 className="text-md font-bold text-gray-700 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        Upcoming Schedule
                                     </h4>
                                     <div className="space-y-4">
                                        {upcomingEvents.map((record) => (
                                            <div key={record.id} className="relative pl-6 group border-l-2 border-blue-200 border-dashed ml-3">
                                                 <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-blue-200 ring-4 ring-white"></div>
                                                 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                     <div>
                                                         <span className="text-sm text-blue-600 font-bold block mb-1">
                                                            {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                                                         </span>
                                                         <h4 className="text-base font-bold text-gray-800">{record.title}</h4>
                                                         <p className="text-gray-600 text-sm mt-1">{record.notes}</p>
                                                     </div>
                                                     <div className="flex flex-col items-end gap-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getEventTypeColor(record.type)}`}>
                                                            {record.type}
                                                        </span>
                                                         <div className="flex gap-2 mt-1">
                                                            <button 
                                                                onClick={() => openEditRecordModal(record)}
                                                                className="text-xs text-blue-600 hover:underline"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteRecord(record.id)}
                                                                className="text-xs text-red-500 hover:underline"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                     </div>
                                                 </div>
                                            </div>
                                        ))}
                                     </div>
                                </div>
                            )}
                            <div>
                                <h4 className="text-md font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    History
                                </h4>
                                <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
                                    {pastEvents.map((record) => (
                                        <div key={record.id} className="relative pl-8 group">
                                            <div className={`absolute -left-[9px] top-1 w-5 h-5 rounded-full border-2 bg-white ${
                                                record.type === 'Vaccination' ? 'border-blue-400' :
                                                record.type === 'Illness' ? 'border-red-400' :
                                                'border-green-400'
                                            }`}></div>
                                            
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                <div className="flex-1">
                                                    <span className="text-sm text-gray-400 font-medium block mb-1">
                                                        {new Date(record.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                    <h4 className="text-base font-bold text-gray-800">{record.title}</h4>
                                                    <p className="text-gray-600 text-sm mt-1">{record.notes}</p>
                                                    {record.treatment && (
                                                        <div className="mt-2 bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-100 inline-block">
                                                            <strong>Treatment:</strong> {record.treatment}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getEventTypeColor(record.type)}`}>
                                                        {record.type}
                                                    </span>
                                                    <div className="flex gap-2 mt-1">
                                                        <button 
                                                            onClick={() => openEditRecordModal(record)}
                                                            className="p-1 text-gray-400 hover:text-green-600"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteRecord(record.id)}
                                                            className="p-1 text-gray-400 hover:text-red-500"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showRecordModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4 pt-12">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
                        <button 
                            onClick={() => setShowRecordModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-sm hover:bg-white/60 text-gray-600 transition-all z-10"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">{editingRecordId ? 'Edit Medical Record' : 'Add Medical Record'}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                                    <input 
                                        type="date" 
                                        value={recordForm.date}
                                        onChange={(e) => setRecordForm({...recordForm, date: e.target.value})}
                                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                    <select 
                                        value={recordForm.type}
                                        onChange={(e) => setRecordForm({...recordForm, type: e.target.value as any})}
                                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="Checkup">Checkup</option>
                                        <option value="Vaccination">Vaccination</option>
                                        <option value="Illness">Illness</option>
                                        <option value="Injury">Injury</option>
                                        <option value="Surgery">Surgery</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                                <input 
                                    type="text" 
                                    value={recordForm.title}
                                    onChange={(e) => setRecordForm({...recordForm, title: e.target.value})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                                <textarea 
                                    rows={2}
                                    value={recordForm.notes}
                                    onChange={(e) => setRecordForm({...recordForm, notes: e.target.value})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Vet / Caretaker</label>
                                    <input 
                                        type="text" 
                                        value={recordForm.veterinarian}
                                        onChange={(e) => setRecordForm({...recordForm, veterinarian: e.target.value})}
                                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Cost</label>
                                    <input 
                                        type="text" 
                                        value={recordForm.cost}
                                        onChange={(e) => setRecordForm({...recordForm, cost: e.target.value})}
                                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Treatment</label>
                                <input 
                                    type="text" 
                                    value={recordForm.treatment}
                                    onChange={(e) => setRecordForm({...recordForm, treatment: e.target.value})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button 
                                onClick={() => setShowRecordModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveRecord}
                                disabled={!recordForm.title}
                                className="px-4 py-2 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                {editingRecordId ? 'Update Record' : 'Save Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="p-6 md:p-10 animate-fade-in">
       <div className="flex justify-between items-center mb-10">
        <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Livestock</h2>
            <p className="text-gray-500 font-medium mt-1">Manage your herd and health records.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Livestock
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {animals.map((animal) => (
          <div key={animal.id} onClick={() => handleSelectAnimal(animal)} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-green-200 transition-all cursor-pointer relative group duration-300 overflow-hidden">
            <button 
                onClick={(e) => handleDeleteAnimal(e, animal.id, animal.name)}
                className="absolute top-2 right-2 p-2.5 bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all z-20 shadow-md border border-white/50"
                title="Delete Animal"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="h-32 bg-gray-100 relative">
                 {animal.coverUrl ? (
                     <img src={animal.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                 ) : (
                     <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100" />
                 )}
                 <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center text-2xl overflow-hidden">
                     {animal.imageUrl ? (
                         <img src={animal.imageUrl} className="w-full h-full object-cover" alt="Profile" />
                     ) : (
                         getAnimalIcon(animal.type)
                     )}
                 </div>
            </div>

            <div className="pt-10 pb-6 px-6">
               <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors truncate pr-2">{animal.name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm whitespace-nowrap ${getStatusColor(animal.status)}`}>
                        {animal.status}
                    </span>
               </div>
               <p className="text-sm text-gray-500 font-medium mb-4">{animal.breed} {animal.type}</p>

               <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-50">
                    <div>
                        <span className="text-gray-400 text-xs uppercase font-bold tracking-wider block mb-0.5">Gender</span>
                        <span className="font-semibold text-gray-700">{animal.gender}</span>
                    </div>
                    <div>
                        <span className="text-gray-400 text-xs uppercase font-bold tracking-wider block mb-0.5">Age</span>
                        <span className="font-semibold text-gray-700">{calculateAge(animal.birthDate)}</span>
                    </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {animals.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 mt-6">
              <div className="text-6xl mb-4 grayscale opacity-50">🐄</div>
              <h3 className="text-xl font-bold text-gray-900">No animals yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Add your first animal to start tracking health records and care history.</p>
              <button 
                  onClick={() => setShowAddModal(true)}
                  className="text-green-600 font-bold hover:underline"
              >
                  Add Your First Animal
              </button>
          </div>
      )}

       {showAddModal && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-24 md:pt-36">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] m-4 flex flex-col relative">
                    <button 
                        onClick={() => setShowAddModal(false)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-sm hover:bg-white/60 text-gray-600 transition-all z-10"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-800">Add New Animal</h3>
                    </div>
                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 min-h-0">
                         <div className="flex gap-6 items-center justify-center mb-2">
                            <div 
                                onClick={() => addFileInputRefProfile.current?.click()}
                                className="w-20 h-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all overflow-hidden relative group"
                            >
                                {newAnimal.imageUrl ? (
                                    <img src={newAnimal.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center group-hover:scale-105 transition-transform">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Profile</span>
                                        <svg className="w-6 h-6 text-gray-300 mx-auto group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                </div>
                            </div>
                            <div 
                                onClick={() => addFileInputRefCover.current?.click()}
                                className="w-32 h-20 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all overflow-hidden relative group"
                            >
                                 {newAnimal.coverUrl ? (
                                    <img src={newAnimal.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center group-hover:scale-105 transition-transform">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Cover</span>
                                        <svg className="w-6 h-6 text-gray-300 mx-auto group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                </div>
                            </div>
                            <input type="file" ref={addFileInputRefProfile} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={(e) => handleImageUpload(e, 'imageUrl', true)} />
                            <input type="file" ref={addFileInputRefCover} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={(e) => handleImageUpload(e, 'coverUrl', true)} />
                         </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Bessie"
                                    value={newAnimal.name}
                                    onChange={(e) => setNewAnimal({...newAnimal, name: e.target.value})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-gray-400"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Type</label>
                                <select 
                                    value={newAnimal.type}
                                    onChange={(e) => setNewAnimal({...newAnimal, type: e.target.value})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                >
                                    <option value="Cattle">Cattle</option>
                                    <option value="Pig">Pig</option>
                                    <option value="Sheep">Sheep</option>
                                    <option value="Chicken">Chicken</option>
                                    <option value="Goat">Goat</option>
                                    <option value="Horse">Horse</option>
                                    <option value="Dog">Dog</option>
                                    <option value="Llama">Llama</option>
                                    <option value="Donkey">Donkey</option>
                                    <option value="Cat">Cat/Kitten</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Breed</label>
                                <input 
                                    type="text" 
                                    value={newAnimal.breed}
                                    onChange={(e) => setNewAnimal({...newAnimal, breed: e.target.value})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Gender</label>
                                <select 
                                    value={newAnimal.gender}
                                    onChange={(e) => setNewAnimal({...newAnimal, gender: e.target.value as any})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                >
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Status</label>
                                <select 
                                    value={newAnimal.status}
                                    onChange={(e) => setNewAnimal({...newAnimal, status: e.target.value as any})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                >
                                    <option value="Healthy">Healthy</option>
                                    <option value="Sick">Sick</option>
                                    <option value="Vet Check Required">Vet Check Required</option>
                                    <option value="Pregnant">Pregnant</option>
                                    <option value="Lactating">Lactating</option>
                                    <option value="Deceased">Deceased</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Birth Date</label>
                                <input 
                                    type="date" 
                                    value={newAnimal.birthDate}
                                    onChange={(e) => setNewAnimal({...newAnimal, birthDate: e.target.value})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-600"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Weight</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 150 lbs"
                                    value={newAnimal.weight}
                                    onChange={(e) => setNewAnimal({...newAnimal, weight: e.target.value})}
                                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
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
                            onClick={handleCreateAnimal}
                            disabled={!newAnimal.name}
                            className="px-6 py-2.5 bg-green-600 rounded-xl text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                        >
                            Add Animal
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
