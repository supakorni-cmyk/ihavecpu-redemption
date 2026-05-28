// app/nvidia-angpao/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function IntelLanding() {
  const { data: session } = useSession();
  
  // State to track if codes are available. null = loading, true = yes, false = no
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Fetch availability from our API (passing a query param for NVIDIA)
    const checkStock = async () => {
      try {
        const res = await fetch("/api/check-availability?promo=intel");
        const data = await res.json();
        setIsAvailable(data.available);
      } catch (error) {
        console.error("Failed to fetch availability", error);
        setIsAvailable(false); // Default to false if error to prevent false hope
      }
    };
    checkStock();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      
      {/* Promo Hero Banner with Background Image */}
      <div className="relative text-white py-24 md:py-32 overflow-hidden bg-gray-900">
        <Image
          // Make sure you add an image named "nvidia-banner.jpg" to your public folder!
          src="/intelbanner.jpg" 
          alt="Intel Spring Gaming Bundle"
          fill
          className="object-cover"
          priority 
        />
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="relative z-20 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white drop-shadow-lg">
            Intel® Spring Gaming Bundle
          </h1>
          <p className="text-xl text-green-100 drop-shadow-md">
            Exclusive Game Bundle
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-30">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 md:p-16">
          
          {/* Main Content & Rules */}
          <div className="prose max-w-none text-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 border-b pb-4 mb-6">รายละเอียดโปรโมชั่น (Promotion Details)</h2>
            <p className="mb-6 text-lg leading-relaxed text-red-600 font-bold">
              *จำกัด 1 สิทธิ์ ต่อ 1 บัญชีผู้ใช้เท่านั้น*
            </p>
            <p className="mb-6 text-lg leading-relaxed">
              ซื้อ CPU / Notebook Intel® Core™ Ultra รุ่นที่ร่วมรายการ รับฟรี! LEGO® Batman™: Legacy of the Dark Knight
            </p>

            <h3>สินค้าที่เข้าร่วมรายการ (Participating Products)</h3>
            <ul className="list-disc pl-5 mb-8 space-y-2 text-lg">
              <li>Intel® Core™ Ultra 5,7,9 Plus (Series 2)</li>
              <li>Intel® Core™ Ultra 5,7,9 (Series 2)</li>
              <li>Intel® Core™ Ultra 5,7,9 (Series 3)</li>
            </ul>
            <h3><strong><Link href="https://ihavecpu.com/shops/intelspringgamingbundle">ไปที่หน้าสินค้า</Link></strong></h3>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">เงื่อนไขการรับสิทธิ์ (Terms & Conditions)</h3>
            <ul className="list-disc pl-5 mb-8 space-y-3 text-lg">
              <li>โปรโมชั่นนี้สงวนสิทธิ์เฉพาะลูกค้าที่ซื้อสินค้าจาก iHAVECPU ตามช่วงเวลาที่กำหนดเท่านั้น</li>
              <li>ใบเสร็จ 1 ใบ สามารถใช้แลกรับสิทธิ์ได้เพียง 1 ครั้งเท่านั้น (1 Receipt = 1 Redemption)</li>
              <li>โค้ดไอเทมไม่สามารถแลกเปลี่ยนเป็นเงินสดได้</li>
              <li>บริษัทฯ ขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไขโดยไม่ต้องแจ้งให้ทราบล่วงหน้า</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">ขั้นตอนการแลกรับ (Instructions)</h3>
            <ol className="list-decimal pl-5 mb-12 space-y-3 text-lg">
              <li>เตรียมรูปถ่ายใบเสร็จที่เห็นวันที่และรายการสินค้าชัดเจน</li>
              <li>เข้าสู่ระบบ (Log in) ด้วยบัญชี Google ของคุณ</li>
              <li>กรอกข้อมูลและอัปโหลดรูปภาพใบเสร็จในหน้า Redeem</li>
              <li>รอทีมงานตรวจสอบ (ใช้เวลาประมาณ 1-2 วันทำการ)</li>
              <li>รับ Master Key ในหน้า <strong>My Rewards</strong> ของคุณ</li>
              <li>นำ Masterkey ที่ได้ไปลงทะเบียนต่อที่ <strong><Link href="https://softwareoffer.intel.com/">Link</Link> </strong></li>
            </ol>
          </div>

          {/* Action Button Section */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center mt-10">
            <h4 className="text-xl font-bold text-gray-900 mb-6">พร้อมแลกรับสิทธิ์แล้วหรือยัง?</h4>
            
            {session ? (
              // If logged in, check availability status
              isAvailable === null ? (
                <button disabled className="w-full md:w-auto bg-gray-300 text-gray-600 px-12 py-5 rounded-full font-bold text-xl cursor-wait">
                  กำลังตรวจสอบสิทธิ์... (Checking...)
                </button>
              ) : isAvailable ? (
                <Link href="/nvidia-angpao/redeem">
                  {/* Changed button to NVIDIA Green */}
                  <button className="w-full md:w-auto bg-green-600 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-green-700 shadow-lg transition-transform hover:scale-105">
                    Redeem Now (แลกรับสิทธิ์)
                  </button>
                </Link>
              ) : (
                <button disabled className="w-full md:w-auto bg-gray-400 text-white px-12 py-5 rounded-full font-bold text-xl cursor-not-allowed opacity-80">
                  สิทธิ์เต็มแล้ว (Fully Redeemed)
                </button>
              )
            ) : (
              // If NOT logged in
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