import React from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '@/locales/useTranslation';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

interface DashboardNavigationProps {
  items: NavItem[];
  open?: boolean;
  onClose?: () => void;
  className?: string;
}

export function DashboardNavigation({
  items,
  open = true,
  onClose,
  className,
}: DashboardNavigationProps) {
  const [location, navigate] = useLocation();
  const { language } = useTranslation();
  const isRTL = language === 'ar';

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside
        className={cn(
          'hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-[calc(100vh-73px)] overflow-y-auto',
          className
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <nav className="flex-1 px-4 py-6 space-y-2">
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left',
                location === item.path
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
              )}
            >
              <span className="flex-shrink-0 w-6 h-6">{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="flex-shrink-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={onClose}
          />

          {/* Mobile Menu */}
          <aside
            className={cn(
              'fixed top-0 left-0 h-screen w-64 bg-white z-40 md:hidden overflow-y-auto transition-transform duration-300',
              isRTL ? 'translate-x-full' : '-translate-x-full'
            )}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <nav className="px-4 py-6 space-y-2 mt-16">
              {items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left',
                    location === item.path
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  )}
                >
                  <span className="flex-shrink-0 w-6 h-6">{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="flex-shrink-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
