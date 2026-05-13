'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/transactions', label: 'Transactions' },
    { href: '/budget', label: 'Budget' },
  ];

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-full mx-auto px-8">
        <div className="flex items-center justify-left h-16">
          {/* Logo/Brand */}
          <Link href="/" className="text-2xl font-bold text-black mr-10">
            Xpenses
          </Link>

          {/* Navigation Links */}
          <div className="flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-lg transition ${
                    isActive
                      ? 'text-blue-700 hover:bg-blue-100'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}