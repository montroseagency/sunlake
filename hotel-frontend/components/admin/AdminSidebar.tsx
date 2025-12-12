'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MdDashboard } from 'react-icons/md';
import { FaBed, FaCalendarAlt, FaClipboardList, FaImages, FaEnvelope, FaComments } from 'react-icons/fa';
import { FiLogOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface AdminSidebarProps {
  onLogout: () => void;
  userName?: string;
  userRole?: string;
}

export default function AdminSidebar({ onLogout, userName, userRole }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: MdDashboard,
      color: 'text-blue-400',
    },
    {
      name: 'Rooms',
      path: '/admin/rooms',
      icon: FaBed,
      color: 'text-purple-400',
    },
    {
      name: 'Availability',
      path: '/admin/availability',
      icon: FaCalendarAlt,
      color: 'text-green-400',
    },
    {
      name: 'Bookings',
      path: '/admin/bookings',
      icon: FaClipboardList,
      color: 'text-orange-400',
    },
    {
      name: 'Gallery',
      path: '/admin/gallery',
      icon: FaImages,
      color: 'text-pink-400',
    },
    {
      name: 'Contacts',
      path: '/admin/contacts',
      icon: FaEnvelope,
      color: 'text-yellow-400',
    },
    {
      name: 'Messages',
      path: '/admin/messages',
      icon: FaComments,
      color: 'text-cyan-400',
    },
  ];

  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-neutral-800 shadow-2xl flex flex-col relative"
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1"
            >
              <h2 className="text-lg font-display font-bold text-white">
                Sunlake Admin
              </h2>
              {userName && (
                <p className="text-xs text-neutral-400 mt-1">
                  {userName} • {userRole}
                </p>
              )}
            </motion.div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-400 hover:text-white"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <FiChevronRight className="w-5 h-5" />
            ) : (
              <FiChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <button
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all relative group ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50'
                      : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r"
                      transition={{ duration: 0.2 }}
                    />
                  )}

                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : item.color}`} />

                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium text-sm"
                    >
                      {item.name}
                    </motion.span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-neutral-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                      {item.name}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900"></div>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-700">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all group ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <FiLogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-medium text-sm"
            >
              Logout
            </motion.span>
          )}

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-neutral-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
              Logout
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900"></div>
            </div>
          )}
        </button>
      </div>
    </motion.div>
  );
}
