// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if the logged-in user is the admin
  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  return (
    <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand / Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2">
            {/* The leading slash tells Next.js to look in the public folder */}
            <img 
                src="/logo.png" 
                alt="IHAVECPU Logo" 
                className="h-8 w-auto object-contain" 
            />
            <span className="text-white text-xl font-medium tracking-normal border-l pl-2 border-gray-600">
                Redemption
            </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
            <Link href="/tales-runner" className="text-gray-300 hover:text-white transition-colors">Redeem</Link>
            
            {session && (
              <Link href="/my-rewards" className="text-gray-300 hover:text-white transition-colors">My Rewards</Link>
            )}
            
            {isAdmin && (
              <Link href="/admin" className="text-red-400 hover:text-red-300 font-medium transition-colors">Admin Panel</Link>
            )}

            {/* Auth Button */}
            {session ? (
              <div className="flex items-center space-x-4 ml-4 border-l border-gray-700 pl-4">
                <img src={session.user?.image || "/default-avatar.png"} alt="avatar" className="w-8 h-8 rounded-full border border-gray-600" />
                <button 
                  onClick={() => signOut()}
                  className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-md transition-colors border border-gray-700"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signIn("google")}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-md font-medium transition-colors shadow-md shadow-blue-900/20"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300 hover:text-white focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Home</Link>
            <Link href="/tales-runner" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Redeem</Link>
            {session && <Link href="/my-rewards" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">My Rewards</Link>}
            {isAdmin && <Link href="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-gray-700">Admin Panel</Link>}
            
            {session ? (
              <button onClick={() => signOut()} className="w-full text-left mt-4 block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Log Out</button>
            ) : (
              <button onClick={() => signIn("google")} className="w-full text-left mt-4 block px-3 py-2 rounded-md text-base font-medium text-blue-400 hover:bg-gray-700">Sign In with Google</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}