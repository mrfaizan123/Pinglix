import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Globe, Activity, Trash2, Shield, 
  LogOut, AlertTriangle, CheckCircle2, XCircle 
} from 'lucide-react';
import api from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, websitesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/websites')
      ]);

      setStats(statsRes.data.data);
      setWebsites(websitesRes.data.data);
    } catch (err) {
      setError('Failed to fetch admin data. Are you logged in as admin?');
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/admin/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the website "${name}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/admin/websites/${id}`);
        setWebsites(websites.filter(w => w._id !== id));
        fetchData(); // Refresh stats
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete website');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await api.get('/admin/logout');
      navigate('/admin/login');
    } catch (err) {
      console.error(err);
      navigate('/admin/login');
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl mb-8">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
              <p className="text-sm text-slate-400">Pinglix Global Overview</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Logout Admin
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 flex items-center gap-3">
            <AlertTriangle size={20} />
            {error}
          </div>
        )}

        {/* Analytics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl">
                <Users size={28} />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                <div className="text-sm text-slate-400 font-medium">Registered Users</div>
              </div>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl">
                <Globe size={28} />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{stats.totalWebsites}</div>
                <div className="text-sm text-slate-400 font-medium">Tracked URLs</div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{stats.onlineWebsites}</div>
                <div className="text-sm text-slate-400 font-medium">Online Websites</div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl">
                <XCircle size={28} />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{stats.offlineWebsites}</div>
                <div className="text-sm text-slate-400 font-medium">Offline Websites</div>
              </div>
            </div>
          </div>
        )}

        {/* Websites Management Table */}
        <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-blue-400" />
              Global Monitors Directory
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">User Email</th>
                  <th className="p-4 font-semibold">Website Name</th>
                  <th className="p-4 font-semibold">URL</th>
                  <th className="p-4 font-semibold">Interval</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {websites.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">
                      No websites registered yet.
                    </td>
                  </tr>
                ) : (
                  websites.map((w) => (
                    <tr key={w._id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="p-4 text-sm font-medium text-white">
                        {w.userId?.email || 'Unknown User'}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-300">
                        {w.websiteName}
                      </td>
                      <td className="p-4 text-sm text-slate-400 font-mono truncate max-w-[200px]" title={w.url}>
                        <a href={w.url} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">
                          {w.url}
                        </a>
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {w.pingInterval} min
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          w.status === 'up' 
                            ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800/50' 
                            : w.status === 'down'
                            ? 'bg-rose-900/20 text-rose-400 border-rose-800/50'
                            : 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}>
                          {w.status === 'up' ? 'Online' : w.status === 'down' ? 'Offline' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDelete(w._id, w.websiteName)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete Website"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
