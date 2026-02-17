import React, { useState, useRef, useEffect } from 'react';
import { diagnoseHealth } from '../services/geminiService';
import { DiagnosisResult, ScoutRecord } from '../types';
import { backend } from '../services/mockBackend';

export const FieldScout: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [history, setHistory] = useState<ScoutRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await backend.getScoutHistory();
    setHistory(data);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null); // Reset previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiagnose = async () => {
    if (!image) {
        alert("Please upload an image first.");
        return;
    }
    setLoading(true);
    try {
      const base64Data = image.split(',')[1];
      if (!base64Data) throw new Error("Invalid image data");
      
      const diagnosis = await diagnoseHealth(base64Data);
      setResult(diagnosis);
      
      const newRecord = await backend.addScoutRecord({
        date: Date.now(),
        imageBase64: image,
        result: diagnosis
      });
      setHistory(prev => [newRecord, ...prev].slice(0, 5));
    } catch (error: any) {
      console.error("Diagnosis failed:", error);
      alert(`Analysis failed: ${error.message || "Please check your internet connection or API key."}`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteRecord = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm("Delete this record?")) {
        await backend.deleteScoutRecord(id);
        setHistory(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8 pb-32 md:pb-8 max-w-6xl mx-auto animate-fade-in">
      
      {/* Friendly Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Farm Scout AI</h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Take a photo of your crop or livestock. Our AI will identify the subject, diagnose issues, and suggest treatments instantly.
        </p>
      </div>

      {/* Main Interaction Area */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 min-h-[500px] flex flex-col md:flex-row">
        
        {/* Left Side: Image / Upload */}
        <div className={`relative w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center transition-all duration-500 ${!image ? 'md:w-full p-12' : 'border-b md:border-b-0 md:border-r border-gray-100'}`}>
            
            {!image ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer group text-center w-full h-full flex flex-col items-center justify-center"
                >
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Tap to Upload Photo</h3>
                    <p className="text-sm text-gray-500">Crops & Livestock Supported</p>
                </div>
            ) : (
                <div className="relative w-full h-full min-h-[300px] bg-black group">
                    <img src={image} alt="Crop" className="w-full h-full object-contain" />
                    <div className="absolute top-4 left-4 flex gap-2">
                        <button 
                            onClick={reset}
                            className="bg-black/50 text-white px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md hover:bg-black/70 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Retake
                        </button>
                    </div>
                </div>
            )}
            <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*" 
               capture="environment"
               onChange={handleImageUpload} 
            />
        </div>

        {/* Right Side: Action / Results */}
        {image && (
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
                
                {/* 1. Pre-Analysis State */}
                {!loading && !result && (
                    <div className="text-center space-y-6">
                         <h3 className="text-2xl font-bold text-gray-900">Photo Ready</h3>
                         <p className="text-gray-500">Click below to identify the subject and diagnose health.</p>
                         <button 
                            onClick={handleDiagnose}
                            className="w-full py-4 bg-white text-green-600 border border-green-200 hover:bg-green-600 hover:text-white rounded-2xl font-bold text-lg shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1"
                        >
                            Run Health Check
                         </button>
                    </div>
                )}

                {/* 2. Loading State */}
                {loading && (
                    <div className="text-center space-y-6">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Analyzing...</h3>
                            <p className="text-gray-500 text-sm mt-1">Detecting species and health markers</p>
                        </div>
                    </div>
                )}

                {/* 3. Result State */}
                {result && !loading && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 
                                    ${result.diseaseName.toLowerCase().includes('healthy') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {result.diseaseName.toLowerCase().includes('healthy') ? 'Healthy' : 'Health Issue Detected'}
                                </span>
                                <h3 className="text-3xl font-extrabold text-gray-900 leading-tight">{result.diseaseName}</h3>
                            </div>
                            <div className="text-center">
                                <div className={`text-sm font-bold ${result.confidence.toLowerCase().includes('high') ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {result.confidence} Match
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                             <p className="text-gray-700 leading-relaxed">{result.description}</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Recommended Action
                            </h4>
                            <ul className="space-y-3">
                                {result.treatment.map((step, idx) => (
                                    <li key={idx} className="flex gap-3 text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                                        <span className="pt-0.5">{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* History Section (Simplified) */}
      {history.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-bold text-gray-900 mb-6 px-2">Recent Scans</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {history.map(record => (
                    <div key={record.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group relative cursor-pointer" onClick={() => { setImage(record.imageBase64); setResult(record.result); window.scrollTo({top:0, behavior:'smooth'})}}>
                         <div className="h-32 bg-gray-200">
                             <img src={record.imageBase64} className="w-full h-full object-cover" />
                         </div>
                         <div className="p-4">
                             <p className="font-bold text-gray-800 truncate text-sm">{record.result.diseaseName}</p>
                             <p className="text-xs text-gray-500 mt-1">{new Date(record.date).toLocaleDateString()}</p>
                         </div>
                         <button 
                             onClick={(e) => handleDeleteRecord(e, record.id)}
                             className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                         >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                    </div>
                ))}
            </div>
          </div>
      )}

    </div>
  );
};