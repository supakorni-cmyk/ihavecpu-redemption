// app/page.tsx
"use client";

import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section (Generalized for the whole Redemption Center) */}
      <div className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-purple-900/50 z-0 pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Level Up Your Gear, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Claim Your Rewards
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-gray-300 mx-auto mb-10">
            Claim exclusive game codes, digital loot, and special rewards with your eligible iHAVECPU purchases.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {!session ? (
              <button 
                onClick={() => signIn("google")}
                className="w-full sm:w-auto px-8 py-4 text-lg font-bold rounded-full bg-blue-600 hover:bg-blue-500 transition-transform hover:scale-105 shadow-lg shadow-blue-600/30"
              >
                Log In to Get Started
              </button>
            ) : (
              <Link href="/my-rewards">
                <button className="w-full sm:w-auto px-8 py-4 text-lg font-bold rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 transition-colors">
                  View My Rewards
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Active Promotions Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Active Promotions</h2>
            <p className="text-gray-600 mt-2">Select a campaign below to redeem your receipt.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Promo Card 1: Tales Runner */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-shadow overflow-hidden flex flex-col">
            {/* Placeholder Image Banner (You can replace the src with a real Tales Runner banner image later) */}
            <div className="h-48 flex items-center justify-center">
              <img src="/tr-banner.jpg" />
            </div>
            <div className="h-14 bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">TALES RUNNER</span>
            </div>
            
            <div className="p-6 flex flex-col flex-grow">
              <span className="text-xs font-bold tracking-wide text-blue-600 uppercase mb-2">Game Loot</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Exclusive In-Game Items</h3>
              <p className="text-gray-600 text-sm mb-6 flex-grow">
                ซื้อ Computer Set Tales Runner เซ็ตใดก็ได้ 1 เซ็ต รับโค้ดพิเศษจากเกมส์ Tales Runner<br />
                • Code 1: ไอเทมระดับ SS Tier ได้ครบทั้งชุด<br />
                • Code 2: กล่องสุ่มไอเทมพิเศษ 90 กล่อง<br />
              </p>
              <p className="text-gray-600 text-sm mb-6 flex-grow">
                *ของรางวัลมีจำนวนจำกัด<br />
                *โปรดอ่านรายละเอียดเพิ่มเติมในหน้าการแลกของรางวัล
              </p>
              
              <Link href="/tales-runner" className="block w-full text-center bg-gray-900 text-white font-medium py-3 rounded-lg hover:bg-red-600 transition-colors">
                ดูรายละเอียดเพิ่มเติม &rarr;
              </Link>
            </div>
          </div>

          {/* Promo Card 2: Coming Soon (Placeholder to show it's a center) */}
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center h-full min-h-[350px] text-center p-6">
            <div className="w-16 h-16 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-3xl mb-4">
              🎁
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">More Promos Coming Soon</h3>
            <p className="text-gray-500 text-sm">
              Keep an eye out for future hardware and gaming campaigns!
            </p>
          </div>

        </div>
      </div>

      {/* How it Works Section (Generalized) */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-6">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Make a Purchase</h3>
              <p className="text-gray-600">Buy an eligible item from iHAVECPU online, in-store, or through retail partners.</p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-6">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Upload Receipt</h3>
              <p className="text-gray-600">Select the active campaign above and securely upload a photo of your receipt.</p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-6">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Get Your Reward</h3>
              <p className="text-gray-600">Once our team verifies your receipt, your unique reward codes will appear in your dashboard!</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}