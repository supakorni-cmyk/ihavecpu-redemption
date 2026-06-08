"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import Link from "next/link";

type Campaign = {
  id: string;
  name: string;
  slug: string;
  period: string;
  details: string;
  sheetId: string;
  imageUrl: string;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  
  // Data States
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal States
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editName, setEditName] = useState("");
  const [editPeriod, setEditPeriod] = useState("");
  const [editSheetId, setEditSheetId] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Security Check: Only Admins can see this dashboard
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase());
    
  const isAdmin = session?.user?.email 
    ? adminEmails.includes(session.user.email.toLowerCase()) 
    : false;

  // 1. Fetch All Campaigns from Firestore
  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Campaign[];
      setCampaigns(list);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchCampaigns();
  }, [isAdmin]);

  // 2. Open Edit Modal and fill it with current campaign data
  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setEditName(campaign.name);
    setEditPeriod(campaign.period);
    setEditSheetId(campaign.sheetId);
    setEditDetails(campaign.details);
  };

  // 3. Save Edited Campaign Changes back to Firestore
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    setIsUpdating(true);

    try {
      const docRef = doc(db, "campaigns", editingCampaign.id);
      await updateDoc(docRef, {
        name: editName,
        period: editPeriod,
        sheetId: editSheetId,
        details: editDetails,
      });

      alert("Campaign updated successfully!");
      setEditingCampaign(null); // Close Modal
      fetchCampaigns(); // Refresh Data list
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update campaign.");
    } finally {
      setIsUpdating(false);
    }
  };

  // 4. Delete Campaign Document completely
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete "${name}"?\nThis action cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, "campaigns", id));
      alert("Campaign deleted successfully!");
      fetchCampaigns(); // Refresh List
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete campaign.");
    }
  };

  if (status === "loading") return <div className="p-10 text-center text-gray-600">Loading Dashboard...</div>;
  if (!session || !isAdmin) return <div className="p-10 text-center text-red-500 font-bold">Access Denied. Admins Only.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-900 p-6 rounded-2xl shadow-lg text-white mb-8 gap-4">
          <div>
            <span className="text-red-500 font-bold text-xs tracking-widest uppercase mb-1 block">Control Center</span>
            <h1 className="text-2xl font-black tracking-tight">Admin Campaign Dashboard</h1>
          </div>
          <Link href="/admin/add-campaign">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md flex items-center gap-2">
              ➕ Add New Campaign
            </button>
          </Link>
        </div>

        {/* Campaigns Table List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Current Running Campaigns</h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-gray-400 animate-pulse">Loading campaigns list...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No campaigns found. Click "+ Add New Campaign" to start!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
                    <th className="p-4 pl-6">Banner</th>
                    <th className="p-4">Campaign Name</th>
                    <th className="p-4">Period</th>
                    <th className="p-4">Google Sheet ID</th>
                    <th className="p-4 text-center pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-sm">
                  {campaigns.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="relative w-20 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        <div>{item.name}</div>
                        <div className="text-xs text-blue-500 font-normal mt-0.5">/promo/{item.slug}</div>
                      </td>
                      <td className="p-4 text-gray-500">{item.period}</td>
                      <td className="p-4 font-mono text-xs text-gray-400 max-w-[150px] truncate" title={item.sheetId}>
                        {item.sheetId}
                      </td>
                      <td className="p-4 text-center pr-6 space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="bg-gray-100 hover:bg-yellow-100 hover:text-yellow-700 text-gray-700 py-1.5 px-4 rounded-lg text-xs font-bold transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id, item.name)}
                          className="bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-600 py-1.5 px-4 rounded-lg text-xs font-bold transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 📋 EDIT MODAL OVERLAY */}
        {editingCampaign && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col animate-scale-up">
              
              <div className="bg-gray-900 p-5 text-white flex justify-between items-center">
                <h3 className="font-black text-xl">Edit Campaign Details</h3>
                <button 
                  onClick={() => setEditingCampaign(null)}
                  className="text-gray-400 hover:text-white text-xl font-bold bg-gray-800 h-8 w-8 rounded-full flex items-center justify-center transition-colors"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6 overflow-y-auto space-y-4 flex-grow text-gray-700">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Campaign Name</label>
                  <input 
                    type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Promotion Period</label>
                  <input 
                    type="text" required value={editPeriod} onChange={(e) => setEditPeriod(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Linked Google Sheet ID</label>
                  <input 
                    type="text" required value={editSheetId} onChange={(e) => setEditSheetId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Details & Conditions</label>
                  <textarea 
                    required rows={6} value={editDetails} onChange={(e) => setEditDetails(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none whitespace-pre-line"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button 
                    type="button" onClick={() => setEditingCampaign(null)}
                    className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" disabled={isUpdating}
                    className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}