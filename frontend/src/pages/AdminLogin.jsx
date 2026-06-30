import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import api from '../services/api';

const AdminLogin = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setServerError('');
      setIsLoading(true);
      
      const response = await api.post('/admin/login', data);
      
      if (response.data.success) {
        // Admin token is HttpOnly, we just need to navigate
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30 mx-auto mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-slate-400 mt-2 text-sm">Restricted access area</p>
        </div>

        {serverError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {serverError}
          </div>
        )}

        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Email</label>
              <input 
                {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                })}
                type="email" 
                className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-900 text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none transition-all"
                placeholder="admin@pinglix.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input 
                {...register('password', { required: 'Password is required' })}
                type="password" 
                className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-900 text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none transition-all"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-red-600/30 transition-all disabled:opacity-70 flex justify-center mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Secure Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
