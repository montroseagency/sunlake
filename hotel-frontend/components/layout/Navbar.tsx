'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AuthModal from '@/components/auth/AuthModal';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
      const userData = JSON.parse(user);
      setUserName(userData.first_name || userData.email);
    }
  }, []);

  const getDashboardRoute = () => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      // Admin and Staff go to admin dashboard
      if (userData.role === 'ADMIN' || userData.role === 'STAFF') {
        return '/admin/dashboard';
      }
    }
    // Regular customers go to client dashboard
    return '/dashboard';
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/rooms', label: 'Rooms' },
    { href: '/about', label: 'About' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = (path: string) => pathname === path;

  const handleBookNow = () => {
    if (isLoggedIn) {
      router.push(getDashboardRoute());
    } else {
      setShowAuthModal(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <nav className="bg-white/70 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl">🏨</div>
            <span className="text-2xl font-display font-bold text-primary-500">
              Sunlake Hotel
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-neutral-700 hover:text-primary-500'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <span className="text-neutral-700">Hello, {userName}</span>
                <Link
                  href={getDashboardRoute()}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-neutral-700 hover:text-red-500 font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleBookNow}
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Book Now
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex flex-col space-y-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-neutral-800 transition-transform ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-neutral-800 transition-opacity ${isOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-neutral-800 transition-transform ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-base font-medium px-4 py-2 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'bg-primary-50 text-primary-500'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isLoggedIn ? (
                <>
                  <Link
                    href={getDashboardRoute()}
                    onClick={() => setIsOpen(false)}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors mx-4"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-medium text-center transition-colors mx-4"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleBookNow();
                    setIsOpen(false);
                  }}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors mx-4"
                >
                  Book Now
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}
