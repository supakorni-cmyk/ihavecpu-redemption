"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddCampaignAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form States
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("");
  const [details, setDetails] = useState("");
  const [sheetId, setSheetId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Security Check: Ensure only Admins can view this page
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase());
    
  const isAdmin = session?.user?.email 
    ? adminEmails.includes(session.user.email.toLowerCase()) 
    : false;

  // Generate a URL-friendly slug from the campaign name (e.g., "Intel Bundle" -> "intel-bundle")
  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please upload a promotion photo.");
    setIsSubmitting(true);

    try {
      // Step 1: Upload the Promotion Photo to Cloudinary
      // ⚠️ IMPORTANT: Replace 'YOUR_CLOUD_NAME_HERE' and make sure 'promo_uploads' preset exists in Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "promo_uploads"); 

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/dlukdk7wu/image/upload`, {
        method: "POST",
        body: formData,
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error("Image upload failed");

      // Step 2: Save campaign details to Firebase
      const campaignSlug = generateSlug(name);
      
      await addDoc(collection(db, "campaigns"), {
        name,
        slug: campaignSlug, // This will be used to generate the dynamic URL
        period,
        details,
        sheetId,
        imageUrl: uploadData.secure_url, // Cloudinary Image URL
        isActive: true, // Default to active
        createdAt: serverTimestamp(),
      });

      alert("Campaign created successfully!");
      router.push("/admin/dashboard"); // Or wherever your main admin dashboard is
      
    } catch (error) {
      console.error(error);
      alert("Failed to create campaign. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") return <div className="p-10 text-center">Loading Admin Panel...</div>;
  if (!session || !isAdmin) return <div className="p-10 text-center text-red-500 font-bold">Access Denied. Admins Only.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
          <div>
            <span className="text-blue-400 font-bold text-sm tracking-widest uppercase mb-1 block">Admin Control</span>
            <h1 className="text-2xl font-black">Add New Campaign</h1>
          </div>
          <Link href="/" className="text-gray-300 hover:text-white text-sm font-medium">
            &larr; Back to Home
          </Link>
        </div>
        
        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-gray-800">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Promotion Name (ชื่อแคมเปญ)</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                placeholder="e.g. Intel Spring Gaming Bundle"
              />
              <p className="text-xs text-gray-400 mt-1">URL will be: /promo/{generateSlug(name) || "your-promo-name"}</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Promotion Period (ระยะเวลา)</label>
              <input 
                type="text" 
                required 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                placeholder="e.g. 1 Jan 2024 - 31 Jan 2024"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Google Sheet ID (สำหรับดึงโค้ด)</label>
            <input 
              type="text" 
              required 
              value={sheetId} 
              onChange={(e) => setSheetId(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm" 
              placeholder="e.g. 1RyxNalVkxxhiGTG_wWW-BeEgEVUtkKZD2sAU2pCfsuk"
            />
            <p className="text-xs text-red-500 mt-1 font-medium">* Make sure to share this specific Google Sheet with your Service Account Email!</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Promotion Details (รายละเอียดและเงื่อนไข)</label>
            <textarea 
              required 
              rows={6}
              value={details} 
              onChange={(e) => setDetails(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" 
              placeholder="Enter the rules, participating products, and instructions here..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Upload Cover Photo (รูปแบนเนอร์)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-1">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" required accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                {file && <p className="text-sm text-blue-600 font-semibold mt-2">Selected: {file.name}</p>}
              </div>
            </div>
          </div>
          
          <button 
            disabled={isSubmitting} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black text-lg mt-6 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
          >
            {isSubmitting ? "Creating Campaign... (กำลังบันทึกข้อมูล)" : "Create Campaign (สร้างแคมเปญ)"}
          </button>

        </form>
      </div>
    </div>
  );
}