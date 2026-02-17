import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/mockBackend';
import { PaymentModal } from './PaymentModal';

interface SettingsProps {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ toggleDarkMode, isDarkMode }) => {
  const { user, deleteAccount, updateProfile } = useAuth();
  const [loadingExport, setLoadingExport] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'account'>('general');

  // Profile Edit State
  const [editName, setEditName] = useState(user?.name || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user?.name) setEditName(user.name);
  }, [user]);

  const handleSaveProfile = async () => {
      setSavingProfile(true);
      try {
          await updateProfile(editName);
          setIsEditingProfile(false);
      } catch (error) {
          alert("Failed to update profile.");
      } finally {
          setSavingProfile(false);
      }
  };

  const handleExportData = async () => {
    setLoadingExport(true);
    try {
      const crops = await backend.getCrops();
      const animals = await backend.getAnimals();
      const scout = await backend.getScoutHistory();
      
      const exportData = {
        user: { name: user?.name, email: user?.email, plan: user?.plan },
        exportedAt: new Date().toISOString(),
        crops,
        animals,
        scoutHistory: scout
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `farmkeeper-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export data");
    } finally {
      setLoadingExport(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.prompt("To confirm deletion, please type 'DELETE' below. This action cannot be undone.");
    if (confirm === 'DELETE') {
      await deleteAccount();
    }
  };

  return (
    <div className="p-4 md:p-8 pb-32 md:pb-8 animate-fade-in max-w-4xl mx-auto">
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Settings</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your account preferences and farm data.</p>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-4 py-3 rounded-xl text-left font-semibold transition-all whitespace-nowrap ${activeTab === 'general' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`}
          >
            General & Appearance
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={`px-4 py-3 rounded-xl text-left font-semibold transition-all whitespace-nowrap ${activeTab === 'data' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`}
          >
            Data Management
          </button>
          <button 
            onClick={() => setActiveTab('account')}
            className={`px-4 py-3 rounded-xl text-left font-semibold transition-all whitespace-nowrap ${activeTab === 'account' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`}
          >
            Account & Subscription
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Appearance</h3>
               
               <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Dark Mode</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes.</p>
                  </div>
                  <button 
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${isDarkMode ? 'bg-green-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
               </div>

               <div className="mt-8">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h3>
                    {!isEditingProfile ? (
                        <button 
                            onClick={() => setIsEditingProfile(true)}
                            className="text-sm font-bold text-green-600 hover:text-green-700 hover:underline"
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                             <button 
                                onClick={() => { setIsEditingProfile(false); setEditName(user?.name || ''); }}
                                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                             <button 
                                onClick={handleSaveProfile}
                                disabled={savingProfile}
                                className="text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                            >
                                {savingProfile ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    )}
                 </div>

                 <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                        <input 
                            type="text" 
                            disabled={!isEditingProfile} 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)}
                            className={`mt-1 block w-full rounded-lg border shadow-sm px-4 py-2 transition-colors focus:outline-none
                                ${isEditingProfile 
                                    ? 'bg-gray-50 text-gray-900 border-gray-200 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:text-white' 
                                    : 'bg-gray-50 text-gray-900 border-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 cursor-default'}`} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                        <input 
                            type="email" 
                            disabled 
                            value={user?.email} 
                            className="mt-1 block w-full rounded-lg border-transparent bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 shadow-sm px-4 py-2 cursor-not-allowed" 
                        />
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                    </div>
                 </div>
               </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
             <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Data</h3>
               
               <div className="flex items-start justify-between py-4">
                  <div className="max-w-md">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Export Farm Data</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Download a copy of all your crops, livestock, and history records in JSON format.</p>
                  </div>
                  <button 
                    onClick={handleExportData}
                    disabled={loadingExport}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loadingExport ? 'Exporting...' : (
                        <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export JSON
                        </>
                    )}
                  </button>
               </div>
             </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Subscription Plan</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Current Plan</p>
                            <h4 className="text-2xl font-extrabold text-green-700 dark:text-green-400 capitalize">{user?.plan} Plan</h4>
                        </div>
                        {user?.plan === 'free' ? (
                            <button 
                                onClick={() => setShowPayment(true)}
                                className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                            >
                                Upgrade to Pro
                            </button>
                        ) : (
                            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-bold border border-green-200 dark:border-green-800">Active</span>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-red-100 dark:border-red-900/30">
                    <h3 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Danger Zone
                    </h3>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-100 dark:border-red-900/50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Delete Account</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-lg">
                                    Permanently delete your account and all associated farm data. This action is irreversible and cannot be undone.
                                </p>
                            </div>
                            <button 
                                onClick={handleDeleteAccount}
                                className="bg-white dark:bg-gray-800 text-red-600 border border-red-200 dark:border-red-800 px-6 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white dark:hover:bg-red-700 transition-colors shadow-sm"
                            >
                                Delete My Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
      
      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
    </div>
  );
};