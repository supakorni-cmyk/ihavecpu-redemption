// app/promo/[slug]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

type Campaign = {
  name: string;
  period: string;
  details: string;
  imageUrl: string;
  sheetId: string;
};

export default function DynamicPromoPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { data: session } = useSession();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // 1. Fetch the custom campaign details from Firestore using the URL slug
  useEffect(() => {
    if (!slug) return;

    const fetchCampaign = async () => {
      try {
        const q = query(collection(db, "campaigns"), where("slug", "==", slug));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as Campaign;
          setCampaign(data);
          
          // Once we have the sheet ID, check code availability
          checkStock(data.sheetId);
        } else {
          setCampaign(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [slug]);

  // 2. Simple stock checker that hooks into your Google Sheet ID dynamically
  const checkStock = async (sheetId: string) => {
    try {
      // You can pass the sheet ID directly to your availability API
      const res = await fetch(`/api/check-availability?sheetId=${sheetId}`);
      const data = await res.json();
      setIsAvailable(data.available);
    } catch (error) {
      console.error("Failed to fetch availability", error);
      setIsAvailable(false); 
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        กำลังโหลดข้อมูลแคมเปญ... (Loading Campaign...)
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
        <p className="text-xl font-bold mb-4">❌ ไม่พบหน้าแคมเปญนี้ (Campaign Not Found)</p>
        <Link href="/" className="text-blue-600 underline">กลับหน้าหลัก (Go Home)</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      
      {/* Dynamic Cover Banner */}
      <div className="relative text-white py-24 md:py-32 overflow-hidden bg-gray-900">
        <Image
          src={campaign.imageUrl} 
          alt={campaign.name}
          fill
          className="object-cover"
          priority 
        />
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="relative z-20 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white drop-shadow-lg">
            {campaign.name}
          </h1>
          <p className="text-xl text-blue-100 drop-shadow-md">
            ระยะเวลาแคมเปญ: {campaign.period}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-30">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 md:p-16">
          
          {/* Main Content Rendered from database text */}
          <div className="prose max-w-none text-gray-700 whitespace-pre-line">
            <h2 className="text-3xl font-bold text-gray-900 border-b pb-4 mb-6">รายละเอียดโปรโมชั่น</h2>
            <p className="text-lg leading-relaxed mb-6">
              {campaign.details}
            </p>
          </div>

          {/* Action Button Section */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center mt-10">
            <h4 className="text-xl font-bold text-gray-900 mb-6">พร้อมแลกรับสิทธิ์แล้วหรือยัง?</h4>
            
            {session ? (
              isAvailable === null ? (
                <button disabled className="w-full md:w-auto bg-gray-300 text-gray-600 px-12 py-5 rounded-full font-bold text-xl cursor-wait">
                  กำลังตรวจสอบสิทธิ์...
                </button>
              ) : isAvailable ? (
                // Points to your general dynamic redeem page or custom structure
                <Link href={`/redeem?promo=${encodeURIComponent(campaign.name)}`}>
                  <button className="w-full md:w-auto bg-blue-600 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-blue-700 shadow-lg transition-transform hover:scale-105">
                    Redeem Now (แลกรับสิทธิ์)
                  </button>
                </Link>
              ) : (
                <button disabled className="w-full md:w-auto bg-gray-400 text-white px-12 py-5 rounded-full font-bold text-xl cursor-not-allowed opacity-80">
                  สิทธิ์เต็มแล้ว (Fully Redeemed)
                </button>
              )
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-gray-500 mb-4">กรุณาเข้าสู่ระบบก่อนทำการแลกรับสิทธิ์</p>
                <button 
                  onClick={() => signIn("google")}
                  className="w-full md:w-auto bg-gray-900 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-gray-800 shadow-lg transition-transform hover:scale-105"
                >
                  Log In to Redeem
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}