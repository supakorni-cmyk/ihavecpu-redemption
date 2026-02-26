"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NvidiaRedeemForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [hasRedeemed, setHasRedeemed] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);

  // Form States (Notice we removed the 'file' state!)
  const [fullName, setFullName] = useState("");
  const [tel, setTel] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("GeForce RTX 5050");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PROMO_NAME = "NVIDIA GeForce RTX 50 Series Angpao";

  // 1. Check if user has already redeemed this specific promo
  useEffect(() => {
    const checkLimit = async () => {
      const userEmail = session?.user?.email; // Safely extract it here
      
      if (userEmail) {
        try {
          const q = query(
            collection(db, "submissions"),
            where("userEmail", "==", userEmail), // Use the safe variable here
            where("promo", "==", PROMO_NAME)
          );
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            setHasRedeemed(true);
          }
        } catch (error) {
          console.error("Error checking limits:", error);
        }
      }
      setCheckingLimit(false);
    };
    
    if (status === "authenticated") {
      checkLimit();
    } else if (status === "unauthenticated") {
      setCheckingLimit(false);
    }
  }, [session, status]);

  // 2. Handle the form submission (No image upload needed!)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userEmail = session?.user?.email; // Safely extract it here
    
    if (!userEmail) return alert("Please log in.");
    if (hasRedeemed) return alert("You have already redeemed this promotion.");
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "submissions"), {
        userEmail: userEmail, // Use the safe variable here!
        fullName,
        tel,
        selectedProduct, 
        receiptUrl: "https://placehold.co/600x400/eeeeee/999999?text=No+Receipt+Required",
        promo: PROMO_NAME,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Success! Your submission is under review.");
      router.push("/my-rewards");
      
    } catch (error) {
      console.error(error);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Security & Loading Checks
  if (status === "loading" || checkingLimit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        กำลังตรวจสอบข้อมูล... (Loading...)
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="mb-4 text-gray-700">Please log in to access this form.</p>
        <Link href="/nvidia-angpao" className="text-blue-600 underline">Go Back</Link>
      </div>
    );
  }

  // 4. BLOCK THE USER IF THEY ALREADY REDEEMED
  if (hasRedeemed) {
    return (
      <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center justify-center">
        <div className="bg-white p-10 rounded-xl shadow-md text-center border-t-4 border-red-500 max-w-lg">
          <div className="text-red-500 text-5xl mb-4">🧧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">สิทธิ์ถูกใช้ไปแล้ว (Already Redeemed)</h2>
          <p className="text-gray-600 mb-6">
            บัญชีของคุณมีการส่งข้อมูลสำหรับโปรโมชั่นนี้ไปแล้ว จำกัด 1 สิทธิ์ต่อ 1 บัญชีเท่านั้น
          </p>
          <Link href="/my-rewards">
            <button className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
              ไปที่ My Rewards ของคุณ
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // 5. Render the Main Form
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        
        {/* Form Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 p-6 text-white text-center">
          <h2 className="text-2xl font-bold drop-shadow-sm">{PROMO_NAME}</h2>
          <p className="text-green-100 text-sm mt-1">Submit your details to claim your reward</p>
        </div>
        
        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5 text-gray-800">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email (Auto-filled)</label>
            <input 
              type="email" 
              value={session?.user?.email || ""}
              disabled 
              className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name (ชื่อ-นามสกุล)</label>
            <input 
              type="text" 
              required 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" 
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Telephone Number (เบอร์โทรศัพท์)</label>
            <input 
              type="tel" 
              required 
              value={tel} 
              onChange={(e) => setTel(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" 
              placeholder="08X-XXX-XXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Product Purchased (รุ่นที่ซื้อ)</label>
            <select 
              value={selectedProduct} 
              onChange={(e) => setSelectedProduct(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white transition-all"
            >
              <option value="GeForce RTX 5050">GeForce RTX 5050</option>
              <option value="GeForce RTX 5060">GeForce RTX 5060</option>
              <option value="GeForce RTX 5070">GeForce RTX 5070</option>
              <option value="GeForce RTX 5070 Ti">GeForce RTX 5070 Ti</option>
            </select>
          </div>
          
          <button 
            disabled={isSubmitting} 
            className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-bold mt-6 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
          >
            {isSubmitting ? "กำลังส่งข้อมูล... (Submitting...)" : "Submit Details (ส่งข้อมูล)"}
          </button>
        </form>
      </div>
    </div>
  );
}