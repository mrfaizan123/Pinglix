import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, LayoutDashboard, LogIn, UserPlus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import logo from "../assets/logo.png";
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-15 h-15 rounded-full bg-slate-900 flex items-center justify-center shadow-md">
  <img
    src={logo}
    alt="Pinglix Logo"
    className="w-101 h-11 object-contain"
  />
</div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                Pinglix
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <div className="hidden md:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-850 pl-4">
                  <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                  <span>{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <>
            
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-md shadow-primary/10"
                >
                  <UserPlus size={16} />
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
