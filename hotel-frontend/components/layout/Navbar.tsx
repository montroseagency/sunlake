'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FiHome, FiInfo, FiImage, FiMail, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { IoBedOutline } from 'react-icons/io5';
import { MdDashboard } from 'react-icons/md';
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
      if (userData.role === 'ADMIN' || userData.role === 'STAFF') {
        return '/admin/dashboard';
      }
    }
    return '/dashboard';
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: FiHome },
    { href: '/rooms', label: 'Rooms', icon: IoBedOutline },
    { href: '/about', label: 'About', icon: FiInfo },
    { href: '/gallery', label: 'Gallery', icon: FiImage },
    { href: '/contact', label: 'Contact', icon: FiMail },
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
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
              <Image
                src="/sunlakelogo.png"
                alt="Sunlake Hotel"
                width={150}
                height={60}
                className="h-12 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(link.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-neutral-700 hover:text-primary-600 hover:bg-neutral-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden lg:flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50">
                    <FiUser className="w-4 h-4 text-neutral-600" />
                    <span className="text-sm font-medium text-neutral-700">{userName}</span>
                  </div>
                  <Link
                    href={getDashboardRoute()}
                    className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-md"
                  >
                    <MdDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-neutral-600 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 text-sm font-medium transition-all"
                  >
                    <FiLogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleBookNow}
                  className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-md"
                >
                  <IoBedOutline className="w-4 h-4" />
                  Book Now
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <FiX className="w-6 h-6 text-neutral-700" />
              ) : (
                <FiMenu className="w-6 h-6 text-neutral-700" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="lg:hidden py-4 border-t border-neutral-100">
              <div className="flex flex-col space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(link.href)
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  );
                })}

                <div className="pt-4 border-t border-neutral-100 mt-2 space-y-2">
                  {isLoggedIn ? (
                    <>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-50">
                        <FiUser className="w-5 h-5 text-neutral-600" />
                        <span className="text-sm font-medium text-neutral-700">{userName}</span>
                      </div>
                      <Link
                        href={getDashboardRoute()}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 bg-primary-500 hover:bg-primary-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                      >
                        <MdDashboard className="w-5 h-5" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-3 w-full text-red-500 hover:bg-red-50 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                      >
                        <FiLogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        handleBookNow();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 w-full bg-primary-500 hover:bg-primary-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      <IoBedOutline className="w-5 h-5" />
                      Book Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
