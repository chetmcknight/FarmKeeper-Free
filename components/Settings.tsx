import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/mockBackend';
import { PaymentModal } from './PaymentModal';

interface SettingsProps {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ toggleDarkMode, isDarkMode }) => {
  const { user, deleteAccount, updateProfile, updatePassword } = useAuth();
  const [loadingExport, setLoadingExport] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'account'>('general');

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

  // Delete Account State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleUpdateProfile = async () => {
      setSavingProfile(true);
      try {
          await updateProfile(name);
          setShowProfileSuccess(true);
          setTimeout(() => setShowProfileSuccess(false), 3000);
      } catch (error) {
          alert("Failed to update profile.");
      } finally {
          setSavingProfile(false);
      }
  };

  const handleUpdatePassword = async () => {
      setPasswordError('');
      if (newPassword.length < 6) {
          setPasswordError("Password must be at least 6 characters.");
          return;
      }
      if (newPassword !== confirmPassword) {
          setPasswordError("Passwords do not match.");
          return;
      }

      setSavingPassword(true);
      try {
          await updatePassword(newPassword);
          setNewPassword('');
          setConfirmPassword('');
          setShowPasswordSuccess(true);
          setTimeout(() => setShowPasswordSuccess(false), 3000);
      } catch (e) {
          setPasswordError("Failed to update password. Please try again.");
      } finally {
          setSavingPassword(false);
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
    if (deleteInput === 'DELETE') {
      await deleteAccount();
    } else {
        alert("Incorrect confirmation text.");
    }
  };

  return (
    <div className="p-4 md:p-8 pb-32 md:pb-8 animate-fade-in max-w-4xl mx-auto">
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Settings</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your account preferences and farm data.</p>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
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
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h3>
                    
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                            <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-200 bg-gray-50 text-gray-900 shadow-sm px-4 py-2.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
                                />
                                <button 
                                    onClick={handleUpdateProfile}
                                    disabled={savingProfile || name === user?.name}
                                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:bg-gray-300 transition-colors"
                                >
                                    {savingProfile ? 'Saving...' : 'Update'}
                                </button>
                            </div>
                            {showProfileSuccess && <p className="text-sm text-green-600 mt-2 font-medium animate-pulse">Profile updated successfully!</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                            <input 
                                type="email" 
                                disabled 
                                value={user?.email} 
                                className="block w-full rounded-lg border border-gray-100 bg-gray-100 text-gray-500 shadow-sm px-4 py-2.5 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Change Password</h3>
                    
                    <div className="grid gap-4 max-w-md">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full rounded-lg border border-gray-200 bg-gray-50 text-gray-900 shadow-sm px-4 py-2.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full rounded-lg border border-gray-200 bg-gray-50 text-gray-900 shadow-sm px-4 py-2.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
                            />
                        </div>
                        
                        {passwordError && <p className="text-sm text-red-600 font-medium">{passwordError}</p>}
                        {showPasswordSuccess && <p className="text-sm text-green-600 font-medium animate-pulse">Password changed successfully!</p>}
                        
                        <div className="pt-2">
                             <button 
                                onClick={handleUpdatePassword}
                                disabled={savingPassword || !newPassword}
                                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-bold hover:bg-black disabled:opacity-50 transition-colors dark:bg-gray-600 dark:hover:bg-gray-500"
                            >
                                {savingPassword ? 'Updating...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-200">Dark Mode</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Reduce eye strain with a dark color theme.</p>
                        </div>
                        <button 
                            onClick={toggleDarkMode}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${isDarkMode ? 'bg-green-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
             <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Farm Data</h3>
               
               <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-3xl shadow-md text-indigo-500">
                          💾
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">Export Full Backup</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Download a comprehensive JSON file containing all your crops, livestock profiles, and scout history.
                        </p>
                      </div>
                  </div>
                  <button 
                    onClick={handleExportData}
                    disabled={loadingExport}
                    className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loadingExport ? 'Generating JSON...' : 'Download a JSON file containing your crops and livestock data'}
                  </button>
               </div>
             </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Subscription Plan</h3>
                    
                    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Current Plan</p>
                            <h4 className="text-3xl font-extrabold text-green-700 dark:text-green-400 capitalize flex items-center gap-2">
                                {user?.plan} Plan
                                {user?.plan === 'pro' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">ACTIVE</span>}
                            </h4>
                            <p className="text-sm text-gray-500 mt-2">
                                {user?.plan === 'free' ? 'Limited access to features.' : 'Unlimited access to all premium features.'}
                            </p>
                        </div>
                        {user?.plan === 'free' ? (
                            <button 
                                onClick={() => setShowPayment(true)}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:scale-105 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                Upgrade to Pro
                            </button>
                        ) : (
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Renews Monthly</p>
                                <button className="text-xs text-red-500 hover:underline mt-1">Manage Subscription</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-red-100 dark:border-red-900/30">
                    <h3 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Danger Zone
                    </h3>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-100 dark:border-red-900/50">
                        <div className="flex flex-col justify-between items-start gap-4">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Delete Account</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-lg">
                                    Permanently delete your account and all associated farm data. This action is irreversible.
                                </p>
                            </div>
                            
                            {!showDeleteConfirm ? (
                                <button 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="bg-white dark:bg-gray-800 text-red-600 border border-red-200 dark:border-red-800 px-6 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white dark:hover:bg-red-700 transition-colors shadow-sm"
                                >
                                    Delete My Account
                                </button>
                            ) : (
                                <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl border border-red-200 dark:border-red-800 mt-2">
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Type "DELETE" to confirm:</p>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={deleteInput}
                                            onChange={(e) => setDeleteInput(e.target.value)}
                                            placeholder="DELETE"
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        />
                                        <button 
                                            onClick={handleDeleteAccount}
                                            disabled={deleteInput !== 'DELETE'}
                                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700"
                                        >
                                            Confirm
                                        </button>
                                        <button 
                                            onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                                            className="text-gray-500 font-bold px-3 py-2 text-sm hover:text-gray-700"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
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