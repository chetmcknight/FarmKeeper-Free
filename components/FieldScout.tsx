import React, { useState, useRef, useEffect } from 'react';
import { diagnosePlantHealth } from '../services/geminiService';
import { DiagnosisResult, ScoutRecord } from '../types';
import { backend } from '../services/mockBackend';

export const FieldScout: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [history, setHistory] = useState<ScoutRecord[]>([]);
  const [isDragging, setIsDragging] = useState(false);
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
      processFile(file);
    }
  };

  const processFile = (file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null); // Reset previous result
      };
      reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
          processFile(file);
      }
  };

  const handleDiagnose = async () => {
    if (!image) return;
    setLoading(true);
    try {
      // Extract base64 part
      const base64Data = image.split(',')[1];
      const diagnosis = await diagnosePlantHealth(base64Data);
      setResult(diagnosis);

      // Save to local storage
      const newRecord = await backend.addScoutRecord({
        date: Date.now(),
        imageBase64: image,
        result: diagnosis
      });
      
      // Update local history state
      setHistory(prev => [newRecord, ...prev].slice(0, 5));
    } catch (error) {
      alert("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecord = (record: ScoutRecord) => {
    setImage(record.imageBase64);
    setResult(record.result);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecord = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Remove this scan from history?")) {
      await backend.deleteScoutRecord(id);
      setHistory(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8 pb-32 md:pb-8 h-full flex flex-col animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Scout AI</h2>
        <p className="text-gray-500 font-medium mt-1">Instant disease and pest identification for your crops.</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 mb-12">
        {/* Input Section */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div 
            className={`border-3 border-dashed rounded-3xl h-80 md:h-96 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group
              ${isDragging ? 'border-green-500 bg-green-50 scale-[1.02]' : 'border-gray-200 hover:border-green-400 bg-white hover:bg-gray-50'}
              ${image ? 'border-green-200' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
             {image ? (
               <div className="relative w-full h-full p-2">
                 <img src={image} alt="Crop preview" className="w-full h-full object-contain rounded-2xl shadow-sm" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                     <p className="text-white font-bold bg-black/20 backdrop-blur px-4 py-2 rounded-lg">Change Image</p>
                 </div>
               </div>
             ) : (
               <div className="text-center p-8 transition-transform duration-300 transform group-hover:-translate-y-2">
                 <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </div>
                 <p className="text-lg font-bold text-gray-800">Drop your photo here</p>
                 <p className="text-sm text-gray-500 mt-2 font-medium">or click to browse from device</p>
               </div>
             )}
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*" 
               capture="environment" // Hint for mobile camera
               onChange={handleImageUpload} 
              />
          </div>

          {image && (
            <button 
              onClick={handleDiagnose}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg transform active:scale-95 text-lg
                ${loading ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Running AI Diagnosis...
                </span>
              ) : 'Analyze Plant Health'}
            </button>
          )}
        </div>

        {/* Results Section */}
        <div className="w-full lg:w-1/2">
          {result && !loading && (
            <div className="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-green-100 p-8 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h3 className="text-2xl font-extrabold text-gray-900">{result.diseaseName}</h3>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm w-fit
                  ${result.confidence.toLowerCase().includes('high') ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                  {result.confidence} Confidence
                </span>
              </div>
              
              <div className="mb-8 bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Diagnosis</h4>
                <p className="text-gray-800 leading-relaxed font-medium">{result.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Recommended Treatment</h4>
                <ul className="space-y-4">
                  {result.treatment.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow-md">{idx + 1}</span>
                      <span className="text-gray-700 font-medium pt-1">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
               <div className="mt-8 pt-6 border-t border-gray-100 text-right">
                  <span className="text-xs font-semibold text-gray-400 flex items-center justify-end gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                    Saved to History
                  </span>
               </div>
            </div>
          )}
          
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 p-12 text-center min-h-[300px]">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm mb-6">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <p className="text-xl font-bold text-gray-500">Ready to Analyze</p>
              <p className="text-sm mt-3 max-w-xs font-medium text-gray-400">Upload a photo to detect diseases, pests, or nutrient deficiencies.</p>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="border-t border-gray-100 pt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Scans</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {history.map((record) => (
              <div 
                key={record.id} 
                onClick={() => handleSelectRecord(record)}
                className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-green-300 transition-all cursor-pointer transform hover:-translate-y-1"
              >
                <div className="h-36 bg-gray-100 overflow-hidden relative">
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                   <img src={record.imageBase64} alt="Scan thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm text-gray-800 truncate">{record.result.diseaseName}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{new Date(record.date).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={(e) => handleDeleteRecord(e, record.id)}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-1.5 text-gray-400 hover:text-red-500 shadow-md opacity-0 group-hover:opacity-100 transition-all z-20 hover:bg-white"
                  title="Delete scan"
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