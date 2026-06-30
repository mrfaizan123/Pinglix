import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';
import Navbar from '../components/Navbar';
const Login = () => {
   
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      setServerError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
   <Navbar></Navbar>

    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className='nav'>
    
    </div>
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-xl z-10 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-primary/30">
            <Activity size={24} />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Sign in to Pinglix to manage your monitors</p>
        </div>

        {serverError && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-100 dark:border-red-900/50">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Email Address</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account? <Link to="/register" className="text-primary hover:text-primary-dark font-medium ml-1">Create one</Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
