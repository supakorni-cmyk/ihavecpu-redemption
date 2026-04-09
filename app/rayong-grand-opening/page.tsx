// app/rayong-grand-opening/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

export default function RayongGrandOpeningLanding() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      
      {/* Promo Hero Banner with Background Image */}
      <div className="relative text-white py-24 md:py-32 overflow-hidden bg-gray-900">
        <Image
          // Make sure you add an image named "rayong-banner.jpg" to your public folder!
          src="/rayong-banner.jpg" 
          alt="iHAVECPU Rayong Grand Opening"
          fill
          className="object-cover"
          priority 
        />
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="relative z-20 max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-orange-500 text-white text-sm font-bold tracking-widest uppercase mb-4 shadow-lg">
            Grand Opening Event
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-white drop-shadow-lg">
            iHAVECPU RAYONG
          </h1>
          <p className="text-xl text-orange-200 drop-shadow-md font-medium">
            ฉลองเปิดสาขาใหม่ ระยอง! รับสิทธิพิเศษและของรางวัลมากมาย
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-30">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 md:p-16">
          
          {/* Main Content & Rules */}
          <div className="prose max-w-none text-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 border-b pb-4 mb-6">รายละเอียดกิจกรรม (Event Details)</h2>
            <p className="mb-6 text-lg leading-relaxed text-orange-600 font-bold">
              *ร่วมสนุกรับของรางวัลพิเศษฉลองเปิดสาขาใหม่ (Join the celebration for exclusive rewards!)*
            </p>
            <p className="mb-6 text-lg leading-relaxed">
              ต้อนรับชาวระยองอย่างเป็นทางการ! เพียงทำตามเงื่อนไขกิจกรรมในช่วง Grand Opening รับสิทธิ์ลุ้นรับของรางวัล แลกรับส่วนลด หรือรับไอเทมสุดพิเศษจากทาง iHAVECPU
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">เงื่อนไขการรับสิทธิ์ (Terms & Conditions)</h3>
            <ul className="list-disc pl-5 mb-8 space-y-3 text-lg">
              <li>สิทธิพิเศษนี้เฉพาะช่วงงาน Grand Opening สาขาระยองเท่านั้น</li>
              <li>จำกัด 1 สิทธิ์ ต่อ 1 บัญชีผู้ใช้ (1 Account = 1 Redemption)</li>
              <li>ของรางวัลและส่วนลดไม่สามารถแลกเปลี่ยนหรือทอนเป็นเงินสดได้</li>
              <li>บริษัทฯ ขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไขโดยไม่ต้องแจ้งให้ทราบล่วงหน้า</li>
            </ul>

            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">ขั้นตอนการเข้าร่วม (Instructions)</h3>
            <ol className="list-decimal pl-5 mb-12 space-y-3 text-lg">
              <li>เข้าสู่ระบบ (Log in) ด้วยบัญชี Google ของคุณ</li>
              <li>กรอกข้อมูลเพื่อลงทะเบียนรับสิทธิ์ในหน้ากิจกรรม</li>
              <li>รอระบบหรือทีมงานตรวจสอบความถูกต้อง</li>
              <li>ตรวจสอบของรางวัลของคุณได้ที่หน้า <strong>My Rewards</strong></li>
            </ol>
          </div>

          {/* Action Button Section */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-8 text-center mt-10">
            <h4 className="text-xl font-bold text-gray-900 mb-6">พร้อมลงทะเบียนรับสิทธิ์แล้วหรือยัง?</h4>
            
            {session ? (
              <Link href="/rayong-grand-opening/redeem">
                <button className="w-full md:w-auto bg-orange-600 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-orange-700 shadow-lg transition-transform hover:scale-105">
                  Register / Redeem Now (ลงทะเบียนรับสิทธิ์)
                </button>
              </Link>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-gray-600 mb-4">กรุณาเข้าสู่ระบบก่อนทำการลงทะเบียน</p>
                <button 
                  onClick={() => signIn("google")}
                  className="w-full md:w-auto bg-gray-900 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-gray-800 shadow-lg transition-transform hover:scale-105"
                >
                  Log In to Register
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}