// app/tales-runner/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function TalesRunnerPromo() {
  const { data: session } = useSession();
  
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("Website");
  const [tel, setTel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const PROMO_NAME = "Intel® Spring Gaming Bundle";

  // If user is not logged in, they shouldn't be here
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please <Link href="/" className="text-blue-600 underline">log in</Link> first.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please upload a receipt.");

    setLoading(true);

    try {
      // 1. Upload receipt to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "receipt_uploads"); // Use the exact preset name you created

      // Replace YOUR_CLOUD_NAME with your actual Cloudinary Cloud Name
      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/dlukdk7wu/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryRes.json();
      
      if (!cloudinaryRes.ok) {
        throw new Error(cloudinaryData.error?.message || "Image upload failed");
      }

      const receiptUrl = cloudinaryData.secure_url; // This is the public link to the image

      // 2. Save data to Firestore Database (This part stays exactly the same!)
      await addDoc(collection(db, "submissions"), {
        userEmail: session.user?.email,
        promo: PROMO_NAME,
        name,
        channel,
        tel,
        receiptUrl, // Saving the new Cloudinary URL here
        status: "pending",
        rewardCode: null,
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting form: ", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-black">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Submission Successful!</h2>
          <p className="mb-4">Your receipt has been uploaded and is currently <strong>Pending</strong> review by our team.</p>
          <p className="text-sm text-gray-500 mb-6">Check back later to see your unique code.</p>
          <Link href="/">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">Return Home</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-10 flex flex-col items-center bg-gray-50 text-black">
      <div className="max-w-xl w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 flex items-center justify-center mx-auto">Intel® Spring Gaming Bundle</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email (Auto-filled)</label>
            <input type="email" value={session.user?.email || ""} disabled className="w-full border p-2 rounded bg-gray-100" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Buying Channel</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full border p-2 rounded">
              <option value="Website">Website</option>
              <option value="Store">หน้าร้าน iHAVECPU</option>
              <option value="E-commerce">Shopee/Lazada</option>
              <option value="Facebook">Facebook</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telephone Number</label>
            <input type="tel" required value={tel} onChange={(e) => setTel(e.target.value)} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload Receipt</label>
            <input type="file" required accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full border p-2 rounded" />
          </div>

          <button type="submit" disabled={loading} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400">
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </main>
  );
}