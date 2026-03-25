import React from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface DashboardHeaderProps {
  title: string;
  icon?: React.ReactNode;
  onMenuToggle?: (open: boolean) => void;
  menuOpen?: boolean;
}

export function DashboardHeader({
  title,
  icon,
  onMenuToggle,
  menuOpen = false,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useTranslation();
  const [, navigate] = useLocation();

  const isRTL = language === 'ar';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header
      className={`sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm ${
        isRTL ? 'rtl' : 'ltr'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="px-4 py-3 md:py-4 flex items-center justify-between">
        {/* Left/Right Section - Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onMenuToggle && (
            <button
              onClick={() => onMenuToggle(!menuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          )}

          {icon && (
            <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              {icon}
            </div>
          )}

          <h1 className="text-lg md:text-xl font-bold text-gray-800 truncate">
            {title}
          </h1>
        </div>

        {/* Right/Left Section - Controls */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
            className="px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-400 transition-colors font-medium"
          >
            <option value="en">EN</option>
            <option value="ar">AR</option>
          </select>

          {/* User Avatar */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs md:text-sm font-semibold text-gray-800 truncate max-w-[100px]">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role || 'Guest'}
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}
