import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import api from '../services/api';

const AddWebsiteModal = ({ isOpen, onClose, onSuccess }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { pingInterval: 5 }
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await api.post('/websites', {
        websiteName: data.websiteName,
        url: data.url,
        pingInterval: parseInt(data.pingInterval)
      });
      reset();
      onSuccess();
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to add website. Ensure the URL is reachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="text-xl font-bold">Add Monitor</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/50">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Website Name</label>
            <input
              type="text"
              {...register('websiteName', { required: 'Name is required' })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="My Portfolio"
            />
            {errors.websiteName && <p className="text-red-500 text-xs mt-1">{errors.websiteName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Website URL</label>
            <input
              type="url"
              {...register('url', { 
                required: 'URL is required',
                pattern: {
                  value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                  message: 'Enter a valid URL (e.g. https://example.com)'
                }
              })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="https://example.com"
            />
            <p className="text-xs text-slate-500 mt-1.5">Must be publicly accessible. We will verify it immediately.</p>
            {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Ping Interval (minutes)</label>
            <select
              {...register('pingInterval')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            >
              <option value="1">1 Minute (Recommended for Cold-Starts)</option>
              <option value="2">2 Minutes</option>
              <option value="5">5 Minutes</option>
              <option value="10">10 Minutes (Max Interval)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-primary/25 disabled:opacity-70 flex items-center justify-center min-w-[100px]"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWebsiteModal;
