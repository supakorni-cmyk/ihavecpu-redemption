// app/admin/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import Link from "next/link";

// Define the shape of our data
type Submission = {
  id: string;
  userEmail: string;
  name: string;
  channel: string;
  tel: string;
  receiptUrl: string;
  status: string;
};

export default function AdminDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Security Check: Only allow the admin email
  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    if (isAdmin) {
      fetchPendingSubmissions();
    }
  }, [isAdmin]);

  // 2. Fetch all "pending" submissions from Firestore
  const fetchPendingSubmissions = async () => {
    try {
      const q = query(collection(db, "submissions"), where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      
      const fetchedData: Submission[] = [];
      querySnapshot.forEach((doc) => {
        fetchedData.push({ id: doc.id, ...doc.data() } as Submission);
      });
      
      setSubmissions(fetchedData);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Reject
  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this receipt?")) return;
    
    try {
      const submissionRef = doc(db, "submissions", id);
      await updateDoc(submissionRef, { status: "rejected" });
      // Remove it from the UI
      setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
    } catch (error) {
      console.error("Error rejecting:", error);
    }
  };

  // 4. Handle Approve (Basic version for now)
  const handleApprove = async (id: string, userEmail: string) => {
    if (!confirm(`Approve receipt and generate code for ${userEmail}?`)) return;

    try {
      // 1. Ask our backend to grab a code from the Google Sheet
      const res = await fetch("/api/dispense-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to get code");

      // 2. Code acquired! Now update Firestore so the user can see it.
      const submissionRef = doc(db, "submissions", id);
      await updateDoc(submissionRef, { 
        status: "approved",
        rewardCode: data.code 
      });

      // 3. Remove it from the Admin UI
      setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
      alert(`Success! Code ${data.code} was sent to the user.`);
      
    } catch (error: any) {
      console.error("Error approving:", error);
      alert(error.message);
    }
  };

  // --- UI Rendering ---
  
  if (sessionStatus === "loading") return <div className="p-10">Loading...</div>;
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black">
        <div className="bg-red-100 p-6 rounded text-red-700">
          <h1 className="text-xl font-bold">Access Denied</h1>
          <p>You do not have permission to view this page.</p>
          <Link href="/" className="underline mt-4 block text-blue-600">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-10 bg-gray-50 text-black">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <p className="mb-6 text-gray-600">Review pending Tales Runner receipt submissions.</p>

        {loading ? (
          <p>Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <p className="text-green-600 font-medium">All caught up! No pending submissions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-3">User</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Receipt</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-semibold">{sub.name}</p>
                      <p className="text-sm text-gray-500">{sub.userEmail}</p>
                    </td>
                    <td className="p-3 text-sm">
                      <p>Channel: {sub.channel}</p>
                      <p>Tel: {sub.tel}</p>
                    </td>
                    <td className="p-3">
                      <a 
                        href={sub.receiptUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 underline text-sm"
                      >
                        View Image
                      </a>
                    </td>
                    <td className="p-3 flex space-x-2">
                      <button 
                        onClick={() => handleApprove(sub.id, sub.userEmail)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(sub.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}