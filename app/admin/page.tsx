"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
// 1. We imported Timestamp here!
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";

// 2. Updated the type definition (no more 'any')
type Submission = {
  id: string;
  userEmail: string;
  fullName: string;
  buyingChannel: string;
  tel: string;
  receiptUrl: string;
  promo: string;
  status: string;
  rewardCode1?: string;
  rewardCode2?: string;
  discountAmount?: string;
  rejectReason?: string;
  createdAt: Timestamp | null; // <-- Replaced 'any'
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase());
    
  const isAdmin = session?.user?.email 
    ? adminEmails.includes(session.user.email.toLowerCase()) 
    : false;

  useEffect(() => {
    if (isAdmin) {
      fetchPendingSubmissions();
    }
  }, [isAdmin]);

  const fetchPendingSubmissions = async () => {
    try {
      const q = query(collection(db, "submissions"), where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      
      const fetchedData: Submission[] = [];
      querySnapshot.forEach((doc) => {
        fetchedData.push({ id: doc.id, ...doc.data() } as Submission);
      });

      // Safely handle sorting without 'any'
      fetchedData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setSubmissions(fetchedData);
    } catch (error: unknown) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, userEmail: string, promo: string) => {
    if (!confirm(`Approve receipt and generate codes for ${userEmail}?`)) return;

    try {
      const res = await fetch("/api/dispense-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, promo }), 
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get codes");

      const submissionRef = doc(db, "submissions", id);
      
      await updateDoc(submissionRef, { 
        status: "approved",
        rewardCode1: data.code1,
        ...(data.code2 && { rewardCode2: data.code2 }),
        ...(data.discount && { discountAmount: data.discount }) 
      });

      setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
      alert(`Success! Code(s) dispensed.`);
      
    // 3. Replaced 'any' with 'unknown'
    } catch (error: unknown) {
      console.error("Error approving:", error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert("An unknown error occurred while approving.");
      }
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Please enter a reason for rejection (e.g., Blurry image, Wrong date):");
    if (reason === null) return; 

    try {
      const submissionRef = doc(db, "submissions", id);
      
      await updateDoc(submissionRef, { 
        status: "rejected",
        rejectReason: reason || "ไม่ระบุเหตุผล (No reason provided)" 
      });

      setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
      
    // 4. Replaced 'any' with 'unknown'
    } catch (error: unknown) {
      console.error("Error rejecting:", error);
      alert("Failed to reject the receipt.");
    }
  };

  if (status === "loading" || (isAdmin && loading)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">Loading Admin Panel...</div>;
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center border border-red-100">
          <div className="text-red-500 text-5xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have administrator privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full border border-blue-200">
            {submissions.length} Pending Requests
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">All caught up! No pending receipts to review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                
                <div className="bg-gray-100 h-64 border-b border-gray-200 relative group flex items-center justify-center">
                  <a href={sub.receiptUrl} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={sub.receiptUrl} 
                      alt="Receipt" 
                      className="max-h-full max-w-full object-contain cursor-zoom-in group-hover:opacity-90 transition-opacity"
                    />
                  </a>
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to enlarge
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{sub.promo}</h2>
                      <p className="text-sm text-gray-500">
                        {sub.createdAt ? sub.createdAt.toDate().toLocaleString() : "Recently"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6 flex-grow">
                    <p><span className="font-semibold text-gray-900">Name:</span> {sub.fullName}</p>
                    <p><span className="font-semibold text-gray-900">Email:</span> {sub.userEmail}</p>
                    <p><span className="font-semibold text-gray-900">Tel:</span> {sub.tel}</p>
                    <p><span className="font-semibold text-gray-900">Channel:</span> {sub.buyingChannel}</p>
                    {/* Display selected product for NVIDIA if it exists */}
                    {(sub as any).selectedProduct && (
                       <p><span className="font-semibold text-gray-900">Product:</span> {(sub as any).selectedProduct}</p>
                    )}
                  </div>

                  <div className="flex space-x-3 mt-auto">
                    <button 
                      onClick={() => handleApprove(sub.id, sub.userEmail, sub.promo)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(sub.id)}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2.5 rounded-lg transition-colors border border-red-200"
                    >
                      Reject
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}