import Link from 'next/link';
import Image from 'next/image';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <Image
              src="/sunlakelogo.png"
              alt="Sunlake Hotel"
              width={150}
              height={60}
              className="h-12 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-sm leading-relaxed">
              Experience luxury and comfort at our premier hotel. Your perfect stay awaits.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm hover:text-primary-400 transition-colors inline-flex items-center gap-1">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/rooms" className="text-sm hover:text-primary-400 transition-colors inline-flex items-center gap-1">
                  Rooms
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm hover:text-primary-400 transition-colors inline-flex items-center gap-1">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-sm hover:text-primary-400 transition-colors inline-flex items-center gap-1">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:text-primary-400 transition-colors inline-flex items-center gap-1">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <FiMapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <span>123 Luxury Avenue<br />Miami, FL 33139</span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a href="tel:+15551234567" className="hover:text-primary-400 transition-colors">
                  +1 (555) 123-4567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a href="mailto:info@sunlakehotel.com" className="hover:text-primary-400 transition-colors">
                  info@sunlakehotel.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social & Hours */}
          <div>
            <h4 className="text-white font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-3 mb-6">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-neutral-800 hover:bg-blue-600 flex items-center justify-center transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <FaFacebookF className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-neutral-800 hover:bg-pink-600 flex items-center justify-center transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-neutral-800 hover:bg-sky-500 flex items-center justify-center transition-all hover:scale-110"
                aria-label="Twitter"
              >
                <FaTwitter className="w-5 h-5" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FiClock className="w-5 h-5 text-primary-400" />
              <span>Front Desk: 24/7</span>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {currentYear} Sunlake Hotel. All rights reserved.</p>
          <p className="mt-2 text-neutral-500">Built with Next.js & Django</p>
        </div>
      </div>
    </footer>
  );
}
