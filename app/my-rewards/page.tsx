// app/my-rewards/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";

// Define the shape of our data
type Submission = {
  id: string;
  promo: string;
  status: string;
  rewardCode1?: string;
  rewardCode2?: string;
  createdAt: any;
};

export default function MyRewards() {
  const { data: session, status: sessionStatus } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetchMySubmissions();
    }
  }, [session]);

  // Fetch only the submissions belonging to the logged-in user
  const fetchMySubmissions = async () => {
    try {
      const q = query(
        collection(db, "submissions"),
        where("userEmail", "==", session?.user?.email)
      );
      const querySnapshot = await getDocs(q);

      const fetchedData: Submission[] = [];
      querySnapshot.forEach((doc) => {
        fetchedData.push({ id: doc.id, ...doc.data() } as Submission);
      });

      // Sort by newest first
      fetchedData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

      setSubmissions(fetchedData);
    } catch (error) {
      console.error("Error fetching rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Security check: Must be logged in
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-black">
        <p className="mb-4">Please log in to view your rewards.</p>
        <Link href="/" className="text-blue-600 underline">Go Home</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-10 bg-gray-50 text-black">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">My Rewards & Status</h1>

        {submissions.length === 0 ? (
          <p className="text-gray-600">You haven't submitted any receipts yet.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="border p-5 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 hover:bg-white transition-colors">
                
                {/* Left Side: Promo Info */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{sub.promo}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Submitted on: {sub.createdAt ? new Date(sub.createdAt.toDate()).toLocaleDateString() : "Recently"}
                  </p>
                </div>

                {/* Right Side: Status & Codes */}
                <div className="mt-4 md:mt-0 text-right w-full md:w-auto">
                  {sub.status === "pending" && (
                    <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium border border-yellow-200">
                      ⏳ Pending Review
                    </span>
                  )}
                  
                  {sub.status === "rejected" && (
                    <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium border border-red-200">
                      ❌ Receipt Rejected
                    </span>
                  )}

                  {sub.status === "approved" && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-md text-left mt-2 md:mt-0 shadow-sm">
                      <p className="text-green-800 font-bold mb-2 flex items-center">
                        <span className="mr-2">🎉</span> Approved! Here are your codes:
                      </p>
                      <div className="flex flex-col space-y-2">
                        <p className="font-mono text-sm bg-white px-3 py-2 rounded border border-gray-200 select-all">
                          <span className="text-gray-500 font-sans mr-2 text-xs uppercase">Item 1:</span> 
                          {sub.rewardCode1}
                        </p>
                        <p className="font-mono text-sm bg-white px-3 py-2 rounded border border-gray-200 select-all">
                          <span className="text-gray-500 font-sans mr-2 text-xs uppercase">Item 2:</span> 
                          {sub.rewardCode2}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t">
          <Link href="/" className="text-blue-600 font-medium hover:text-blue-800 flex items-center">
             &larr; Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}