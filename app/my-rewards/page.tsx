"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import Link from "next/link";

// 1. Updated shape definitions to perfectly align with Admin panel writes
type Submission = {
  id: string;
  promo: string;
  status: string;
  code1?: string;             // ⚡ FIXED: Matches API / Admin write name
  discountAmount?: string; 
  rejectionReason?: string;    // ⚡ FIXED: Matches Admin write name
  createdAt: Timestamp | null;
};

export default function MyRewards() {
  const { data: session, status: sessionStatus } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetchMySubmissions(session.user.email);
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [session, sessionStatus]);

  const fetchMySubmissions = async (email: string) => {
    try {
      // ⚡ FIXED: Querying "email" instead of "userEmail" to match registration schema
      const q = query(
        collection(db, "submissions"),
        where("email", "==", email.toLowerCase().trim())
      );
      const querySnapshot = await getDocs(q);

      const fetchedData: Submission[] = [];
      querySnapshot.forEach((doc) => {
        fetchedData.push({ id: doc.id, ...doc.data() } as Submission);
      });

      // Sort by newest first
      fetchedData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

      setSubmissions(fetchedData);
    } catch (error) {
      console.error("Error fetching rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">Loading your rewards...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
        <p className="mb-4">Please log in to view your rewards.</p>
        <Link href="/">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Go Home
          </button>
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-10 bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-100">
        <h1 className="text-3xl font-extrabold mb-8 border-b pb-4 text-gray-800">My Rewards & Status</h1>

        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">You haven't submitted any receipts yet.</p>
            <Link href="/" className="text-blue-600 font-medium hover:underline mt-4 inline-block">
              Browse Active Promotions
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((sub) => (
              <div key={sub.id} className="border border-gray-200 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center bg-white hover:shadow-md transition-shadow">
                
                {/* Left Side: Promo Info */}
                <div className="mb-4 md:mb-0">
                  <span className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-1 block">
                    {sub.promo.includes("Intel") ? "Intel Promo" : "Hardware Promo"}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">{sub.promo}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Submitted on: {sub.createdAt ? sub.createdAt.toDate().toLocaleDateString() : "Recently"}
                  </p>
                </div>

                {/* Right Side: Status & Codes */}
                <div className="w-full md:w-auto md:min-w-[320px]">
                  
                  {/* PENDING */}
                  {sub.status === "pending" && (
                    <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg text-sm font-medium border border-yellow-200 flex items-center justify-center">
                      <span className="mr-2 text-lg">⏳</span> Pending Review
                    </div>
                  )}
                  
                  {/* REJECTED */}
                  {sub.status === "rejected" && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-left shadow-sm">
                      <p className="text-red-800 font-bold mb-2 flex items-center">
                        <span className="mr-2">❌</span> Receipt Rejected
                      </p>
                      <div className="bg-white px-3 py-2 rounded border border-red-100">
                        <p className="text-xs text-red-400 font-semibold uppercase mb-1">Reason:</p>
                        <p className="text-sm text-red-600">{sub.rejectionReason || "No reason provided"}</p>
                      </div>
                    </div>
                  )}

                  {/* APPROVED SECTION */}
                  {sub.status === "approved" && (
                    <div className="shadow-sm">
                      
                      {/* NVIDIA ANGPAO DESIGN SPECIAL CASE */}
                      {sub.promo === "NVIDIA GeForce RTX 50 Series Angpao" ? (
                        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-5 rounded-xl text-left">
                          <p className="text-red-700 font-extrabold mb-3 text-lg flex items-center leading-tight">
                            <span className="mr-2 text-2xl">🧧</span> 
                            Congratulation you've got {sub.discountAmount} discount!
                          </p>
                          <div className="bg-white px-4 py-3 rounded-lg border border-red-200 flex items-center justify-between">
                            <span className="text-red-500 font-semibold text-xs uppercase tracking-wider">Your Code:</span> 
                            <span className="font-mono text-lg font-bold text-gray-900 select-all">{sub.code1}</span>
                          </div>
                        </div>
                      ) : (

                      /* GENERAL / INTEL / TALES RUNNER UNIFIED REWARDS CARD */
                        <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl text-left">
                          <p className="text-blue-800 font-bold mb-3 flex items-center">
                            <span className="mr-2 text-xl">🎉</span> Approved! Here is your code:
                          </p>
                          <div className="flex flex-col space-y-2">
                            <div className="font-mono text-sm bg-white px-3 py-2 rounded-lg border border-blue-100 select-all flex justify-between items-center gap-4">
                              <span className="text-blue-400 font-sans text-xs uppercase font-bold whitespace-nowrap">Your Reward Key:</span> 
                              <span className="font-bold text-gray-800 break-all">{sub.code1 || "Code missing"}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
        
        <div className="mt-10 pt-6 border-t border-gray-100">
          <Link href="/" className="text-blue-600 font-medium hover:text-blue-800 flex items-center transition-colors">
             &larr; Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}