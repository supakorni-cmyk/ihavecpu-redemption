// app/page.tsx
"use client";

import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/50 to-black-900/50 z-0 pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Level Up Your Gear.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-800">
              Claim Your Epic Loot.
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-gray-300 mx-auto mb-10">
            Bought a participating product from IHAVECPU? Upload your receipt and instantly redeem exclusive in-game items for Tales Runner!
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {session ? (
              <Link href="/tales-runner">
                <button className="w-full sm:w-auto px-8 py-4 text-lg font-bold rounded-full bg-blue-600 hover:bg-blue-500 transition-transform hover:scale-105 shadow-lg shadow-blue-600/30">
                  Redeem Receipt Now
                </button>
              </Link>
            ) : (
              <button 
                onClick={() => signIn("google")}
                className="w-full sm:w-auto px-8 py-4 text-lg font-bold rounded-full bg-blue-600 hover:bg-blue-500 transition-transform hover:scale-105 shadow-lg shadow-blue-600/30"
              >
                Log In to Redeem
              </button>
            )}
            
            {session && (
               <Link href="/my-rewards">
               <button className="w-full sm:w-auto px-8 py-4 text-lg font-bold rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 transition-colors">
                 Check My Status
               </button>
             </Link>
            )}
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {/* Step 1 */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-6">1</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Make a Purchase</h3>
            <p className="text-gray-600">Buy any eligible item from IHAVECPU online, in-store, or through our retail partners.</p>
          </div>

          {/* Step 2 */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-6">2</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Upload Receipt</h3>
            <p className="text-gray-600">Snap a clear photo of your receipt and submit it through our secure portal.</p>
          </div>

          {/* Step 3 */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-6">3</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Get Your Codes</h3>
            <p className="text-gray-600">Once verified, your unique Tales Runner codes will appear in your "My Rewards" tab!</p>
          </div>
        </div>
      </div>
    </main>
  );
}