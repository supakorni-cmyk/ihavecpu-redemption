// app/tales-runner/page.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

export default function TalesRunnerLanding() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Promo Hero Banner with Background Image */}
      <div className="relative text-white py-24 md:py-32 overflow-hidden bg-gray-900 mb-8">
        
        {/* The Background Image */}
        {/* Ensure your image file is in the 'public' folder named exactly this: */}
        <Image
          src="/tr-banner2.jpg" 
          alt="Tales Runner Promotion Background"
          fill
          className="object-cover"
          priority // Loads image quickly as it's above the fold
        />

        {/* Dark Overlay - Adjust 'bg-black/60' to make it darker/lighter if needed */}
        <div className="absolute inset-0 bg-black/60 z-10" />

        {/* Content (Sitting on top of overlay) */}
        <div className="relative z-20 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white drop-shadow-lg">
            Tales Runner x iHAVECPU
          </h1>
          <p className="text-xl text-blue-100 drop-shadow-md">
            Exclusive In-Game Item Redemption
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-12">
          
          {/* Main Content & Rules */}
          <div className="prose max-w-none text-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">รายละเอียดโปรโมชั่น (Promotion Details)</h2>
            <p className="mb-6">
              ซื้อสินค้า Computer Set Tales Runner จาก iHAVECPU และนำใบเสร็จมาแลกรับโค้ดไอเทมสุดพิเศษจากเกม Tales Runner จำนวน 2 โค้ดทันที! <br />
              • Code 1: ไอเทมระดับ SS Tier ได้ครบทั้งชุด<br />
              • Code 2: กล่องสุ่มไอเทมพิเศษ 90 กล่อง
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-2">เงื่อนไขการรับสิทธิ์ (Terms & Conditions)</h3>
            <ul className="list-disc pl-5 mb-8 space-y-2">
              <li>โปรโมชั่นนี้สงวนสิทธิ์เฉพาะลูกค้าที่ซื้อสินค้าจาก iHAVECPU ตามช่วงเวลาที่กำหนดเท่านั้น</li>
              <li>ใบเสร็จ 1 ใบ สามารถใช้แลกรับสิทธิ์ได้เพียง 1 ครั้งเท่านั้น (1 Receipt = 1 Redemption)</li>
              <li>โค้ดไอเทมไม่สามารถแลกเปลี่ยนเป็นเงินสดได้</li>
              <li>บริษัทฯ ขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไขโดยไม่ต้องแจ้งให้ทราบล่วงหน้า</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-2">ขั้นตอนการแลกรับ (Instructions)</h3>
            <ol className="list-decimal pl-5 mb-10 space-y-2">
              <li>เตรียมรูปถ่ายใบเสร็จที่เห็นวันที่และรายการสินค้าชัดเจน</li>
              <li>เข้าสู่ระบบ (Log in) ด้วยบัญชี Google ของคุณ</li>
              <li>กรอกข้อมูลและอัปโหลดรูปภาพใบเสร็จในหน้า Redeem</li>
              <li>รอทีมงานตรวจสอบ (ใช้เวลาประมาณ 1-2 วันทำการ)</li>
              <li>รับโค้ดในหน้า <strong>My Rewards</strong> ของคุณ</li>
              <li>
                นำโค้ดที่ได้รับไปลงทะเบียนต่อที่: 
                 <Link href="https://member.thehof.gg/talesrunner" target="_blank">
                  <strong>Link</strong>
              </Link>
              </li>
            </ol>
          </div>

          {/* Action Button Section */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center mt-8">
            <h4 className="text-lg font-bold text-gray-900 mb-4">พร้อมแลกรับสิทธิ์แล้วหรือยัง?</h4>
            
            {session ? (
              <Link href="/tales-runner/redeem">
                <button className="w-full md:w-auto bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-700 shadow-md transition-transform hover:scale-105">
                  Redeem Now (แลกรับสิทธิ์)
                </button>
              </Link>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-gray-500 mb-4 text-sm">กรุณาเข้าสู่ระบบก่อนทำการแลกรับสิทธิ์</p>
                <button 
                  onClick={() => signIn("google")}
                  className="w-full md:w-auto bg-gray-900 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-800 shadow-md transition-transform hover:scale-105"
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