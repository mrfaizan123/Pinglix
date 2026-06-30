import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '../services/api';

const WebsiteLogsModal = ({ website, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!website) return;
    const fetchLogs = async () => {
      try {
        const res = await api.get(`/websites/${website._id}/logs?limit=20`);
        setLogs(res.data.data);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [website]);

  if (!website) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50">
          <div>
            <h2 className="text-xl font-bold">Logs: {website.websiteName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{website.url}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-0 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <Clock size={32} className="mb-2 opacity-50" />
              <p>No logs recorded yet.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Checked At</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Response Time</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">HTTP Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 size={14} /> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <XCircle size={14} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {new Date(log.checkedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-300">
                      {log.responseTime ? `${log.responseTime}ms` : '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <span className={`font-mono ${log.success ? 'text-slate-600 dark:text-slate-300' : 'text-red-500'}`}>
                        {log.statusCode || (log.errorMessage === 'Request Timeout' ? 'TIMEOUT' : 'ERR')}
                      </span>
                      {log.errorMessage && !log.statusCode && (
                         <div className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={log.errorMessage}>
                           {log.errorMessage}
                         </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebsiteLogsModal;
