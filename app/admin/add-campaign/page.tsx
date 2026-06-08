// app/admin/add-campaign/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddCampaignAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form Fields
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("");
  const [details, setDetails] = useState("");
  const [sheetId, setSheetId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 📸 Dual Image Uploader States
  const [homeCoverFile, setHomeCoverFile] = useState<File | null>(null);
  const [homeCoverPreview, setHomeCoverPreview] = useState<string | null>(null);

  const [promoBannerFile, setPromoBannerFile] = useState<File | null>(null);
  const [promoBannerPreview, setPromoBannerPreview] = useState<string | null>(null);

  // Admin Verification Gate
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase());
    
  const isAdmin = session?.user?.email 
    ? adminEmails.includes(session.user.email.toLowerCase()) 
    : false;

  // Revoke object URLs to clear browser memory when component leaves screen
  useEffect(() => {
    return () => {
      if (homeCoverPreview) URL.revokeObjectURL(homeCoverPreview);
      if (promoBannerPreview) URL.revokeObjectURL(promoBannerPreview);
    };
  }, [homeCoverPreview, promoBannerPreview]);

  const handleHomeCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setHomeCoverFile(selected);
    if (selected) setHomeCoverPreview(URL.createObjectURL(selected));
    else setHomeCoverPreview(null);
  };

  const handlePromoBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setPromoBannerFile(selected);
    if (selected) setPromoBannerPreview(URL.createObjectURL(selected));
    else setPromoBannerPreview(null);
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeCoverFile || !promoBannerFile) {
      return alert("Please upload both Home Cover and Promo Banner images.");
    }
    setIsSubmitting(true);

    try {
      // 🚀 Step 1: Upload Home Cover Image to Cloudinary
      const homeData = new FormData();
      homeData.append("file", homeCoverFile);
      homeData.append("upload_preset", "promo_uploads"); // Change preset if needed

      // ⚠️ Remember to change 'YOUR_CLOUD_NAME_HERE' 
      const homeRes = await fetch(`https://api.cloudinary.com/v1_1/dlukdk7wu/image/upload`, {
        method: "POST",
        body: homeData,
      });
      const homeUploadResult = await homeRes.json();
      if (!homeRes.ok) throw new Error("Home cover image upload failed");

      // 🚀 Step 2: Upload Wide Promo Banner Image to Cloudinary
      const bannerData = new FormData();
      bannerData.append("file", promoBannerFile);
      bannerData.append("upload_preset", "promo_uploads");

      const bannerRes = await fetch(`https://api.cloudinary.com/v1_1/dlukdk7wu/image/upload`, {
        method: "POST",
        body: bannerData,
      });
      const bannerUploadResult = await bannerRes.json();
      if (!bannerRes.ok) throw new Error("Promo banner image upload failed");

      // Step 3: Write both target URLs into the Firestore document layout
      const campaignSlug = generateSlug(name);
      await addDoc(collection(db, "campaigns"), {
        name,
        slug: campaignSlug, 
        period,
        details,
        sheetId,
        homeCoverUrl: homeUploadResult.secure_url,   // Saved URL 1
        promoBannerUrl: bannerUploadResult.secure_url, // Saved URL 2
        isActive: true, 
        createdAt: serverTimestamp(),
      });

      alert("Campaign created successfully with unique screen assets!");
      router.push("/admin"); 
      
    } catch (error: any) {
      console.error(error);
      alert(`Failed to create campaign: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") return <div className="p-10 text-center text-gray-600 font-medium">Loading Admin Panel...</div>;
  if (!session || !isAdmin) return <div className="p-10 text-center text-red-500 font-black text-xl">Access Denied. Admins Only.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        
        <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
          <div>
            <span className="text-blue-400 font-bold text-sm tracking-widest uppercase mb-1 block">Admin Control</span>
            <h1 className="text-2xl font-black">Add New Campaign (Dual Asset Mode)</h1>
          </div>
          <Link href="/admin" className="text-gray-300 hover:text-white text-sm font-medium">&larr; Back</Link>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-gray-800">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Promotion Name (ชื่อแคมเปญ)</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Intel Spring Gaming Bundle" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Promotion Period (ระยะเวลา)</label>
              <input type="text" required value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 1 Jan 2026 - 31 Jul 2026" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Google Sheet ID</label>
            <input type="text" required value={sheetId} onChange={(e) => setSheetId(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Promotion Details</label>
            <textarea required rows={4} value={details} onChange={(e) => setDetails(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
            
            {/* UPLOADER 1: HOME CARD */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">1. Home Screen Cover (แนะนำรูปสี่เหลี่ยมจัตุรัส)</label>
              {homeCoverPreview && (
                <div className="mb-3 relative w-32 h-32 mx-auto rounded-xl overflow-hidden border border-gray-200">
                  <img src={homeCoverPreview} alt="Home Card Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <input type="file" required accept="image/*" onChange={handleHomeCoverChange} className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer" />
            </div>

            {/* UPLOADER 2: PROMO BANNER */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">2. Promo Page Banner (แนะนำรูปแถบยาวแนวนอน)</label>
              {promoBannerPreview && (
                <div className="mb-3 relative w-full h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-900">
                  <img src={promoBannerPreview} alt="Promo Header Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <input type="file" required accept="image/*" onChange={handlePromoBannerChange} className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer" />
            </div>

          </div>
          
          <button disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black text-lg shadow-md disabled:opacity-50 transition-all">
            {isSubmitting ? "Uploading assets and configuring database..." : "Create Campaign"}
          </button>
        </form>
      </div>
    </div>
  );
}