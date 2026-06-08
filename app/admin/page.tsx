// app/admin/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import Link from "next/link";

type Campaign = {
  id: string;
  name: string;
  slug: string;
  period: string;
  details: string;
  sheetId: string;
  homeCoverUrl: string;   // Updated field tracking
  promoBannerUrl: string; // Updated field tracking
};

type Submission = {
  id: string;
  email: string;
  promo: string;
  status: "pending" | "approved" | "rejected";
  receiptUrl: string;
  code1?: string;
  createdAt: any;
};

export default function UnifiedAdminPanel() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"receipts" | "campaigns">("receipts");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);

  // Campaign Edit Modal System States
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editName, setEditName] = useState("");
  const [editPeriod, setEditPeriod] = useState("");
  const [editSheetId, setEditSheetId] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [isUpdatingCampaign, setIsUpdatingCampaign] = useState(false);

  // Independent edit files states
  const [editHomeCoverFile, setEditHomeCoverFile] = useState<File | null>(null);
  const [editPromoBannerFile, setEditPromoBannerFile] = useState<File | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").split(",").map(e => e.trim().toLowerCase());
  const isAdmin = session?.user?.email ? adminEmails.includes(session.user.email.toLowerCase()) : false;

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Campaign[];
      setCampaigns(list);
      setIsLoadingCampaigns(false);
    });
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "submissions"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Submission[];
      setSubmissions(list);
      setIsLoadingSubmissions(false);
    });
  }, [isAdmin]);

  const handleApproveReceipt = async (submission: Submission) => {
    if (!confirm(`Approve receipt for ${submission.email}?`)) return;
    setProcessingId(submission.id);
    try {
      const res = await fetch("/api/dispense-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submission.email, promo: submission.promo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await updateDoc(doc(db, "submissions", submission.id), {
        status: "approved",
        code1: data.code1,
        approvedAt: new Date(),
      });
      alert("Receipt Approved!");
    } catch (error: any) {
      alert(`Approval Failed: ${error.message}`);
    } finally { setProcessingId(null); }
  };

  const handleRejectReceipt = async (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    setProcessingId(id);
    try {
      await updateDoc(doc(db, "submissions", id), {
        status: "rejected",
        rejectionReason: reason || "ข้อมูลใบเสร็จไม่ชัดเจน",
        rejectedAt: new Date(),
      });
      alert("Receipt Rejected.");
    } catch (error) { alert("Failed to reject entry."); }
    finally { setProcessingId(null); }
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setEditName(campaign.name);
    setEditPeriod(campaign.period);
    setEditSheetId(campaign.sheetId);
    setEditDetails(campaign.details);
    setEditHomeCoverFile(null);
    setEditPromoBannerFile(null);
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?\nThis action cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, "campaigns", id));
      alert("Campaign cleared from registry database.");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Deletion request failed.");
    }
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    setIsUpdatingCampaign(true);

    try {
      let finalHomeCoverUrl = editingCampaign.homeCoverUrl;
      let finalPromoBannerUrl = editingCampaign.promoBannerUrl;

      // Conditional Uploader pipeline 1: Home Cover Card
      if (editHomeCoverFile) {
        const hData = new FormData();
        hData.append("file", editHomeCoverFile);
        hData.append("upload_preset", "promo_uploads");
        const res = await fetch(`https://api.cloudinary.com/v1_1/dlukdk7wu/image/upload`, { method: "POST", body: hData });
        const data = await res.json();
        if (!res.ok) throw new Error("Home asset replacement failed");
        finalHomeCoverUrl = data.secure_url;
      }

      // Conditional Uploader pipeline 2: Promo Long Banner
      if (editPromoBannerFile) {
        const bData = new FormData();
        bData.append("file", editPromoBannerFile);
        bData.append("upload_preset", "promo_uploads");
        const res = await fetch(`https://api.cloudinary.com/v1_1/dlukdk7wu/image/upload`, { method: "POST", body: bData });
        const data = await res.json();
        if (!res.ok) throw new Error("Promo asset replacement failed");
        finalPromoBannerUrl = data.secure_url;
      }

      await updateDoc(doc(db, "campaigns", editingCampaign.id), {
        name: editName,
        period: editPeriod,
        sheetId: editSheetId,
        details: editDetails,
        homeCoverUrl: finalHomeCoverUrl,
        promoBannerUrl: finalPromoBannerUrl
      });

      alert("Campaign assets modified successfully!");
      setEditingCampaign(null);
    } catch (error: any) {
      alert(`Update execution failed: ${error.message}`);
    } finally { setIsUpdatingCampaign(false); }
  };

  if (status === "loading") return <div className="p-10 text-center text-gray-600 font-medium">Loading Management Control Panel...</div>;
  if (!session || !isAdmin) return <div className="p-10 text-center text-red-500 font-black text-xl">Access Denied.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 text-gray-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header layout and Tabs switches */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 p-6 rounded-2xl shadow-lg text-white mb-8 gap-4">
          <div>
            <span className="text-red-500 font-bold text-xs tracking-widest uppercase mb-1 block">Redemption Platform</span>
            <h1 className="text-2xl font-black tracking-tight">iHAVECPU Central Admin Operations</h1>
          </div>
          <div className="flex bg-gray-800 p-1.5 rounded-xl border border-gray-700 w-full md:w-auto">
            <button onClick={() => setActiveTab("receipts")} className={`flex-1 md:flex-none py-2 px-5 rounded-lg text-sm font-bold transition-all ${activeTab === "receipts" ? "bg-red-600 text-white shadow" : "text-gray-400 hover:text-white"}`}>📥 Receipt Approvals</button>
            <button onClick={() => setActiveTab("campaigns")} className={`flex-1 md:flex-none py-2 px-5 rounded-lg text-sm font-bold transition-all ${activeTab === "campaigns" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"}`}>⚙️ Manage Campaigns</button>
          </div>
        </div>

        {/* TAB 1: RECEIPTS VERIFICATION */}
        {activeTab === "receipts" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">User Submissions Log</h2>
            </div>
            {/* ... keeping the verification table logic structured similarly ... */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b">
                    <th className="p-4 pl-6">Receipt</th>
                    <th className="p-4">User Account</th>
                    <th className="p-4">Target Campaign</th>
                    <th className="p-4">Verification Status</th>
                    <th className="p-4 text-center pr-6">Management Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm font-medium">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50/40">
                      <td className="p-4 pl-6">
                        <a href={sub.receiptUrl} target="_blank" rel="noreferrer" className="group block relative w-12 h-12 bg-gray-100 rounded border overflow-hidden">
                          <img src={sub.receiptUrl} alt="receipt" className="w-full h-full object-cover" />
                        </a>
                      </td>
                      <td className="p-4 font-bold">{sub.email}</td>
                      <td className="p-4 text-gray-500 text-xs font-semibold">{sub.promo}</td>
                      <td className="p-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${sub.status === "approved" ? "bg-green-100 text-green-700" : sub.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{sub.status.toUpperCase()}</span>
                      </td>
                      <td className="p-4 text-center pr-6 space-x-2 whitespace-nowrap">
                        {sub.status === "pending" ? (
                          <>
                            <button onClick={() => handleApproveReceipt(sub)} className="bg-green-600 text-white font-bold py-1.5 px-4 rounded-lg text-xs">Approve</button>
                            <button onClick={() => handleRejectReceipt(sub.id)} className="bg-gray-100 text-gray-600 font-bold py-1.5 px-4 rounded-lg text-xs">Reject</button>
                          </>
                        ) : <span className="text-xs font-mono text-gray-400 italic">{sub.code1 ? `Dispensed: ${sub.code1}` : "Closed Logs"}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CAMPAIGN CMS REGISTRY DISPLAY */}
        {activeTab === "campaigns" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Current Campaigns Matrix</h2>
              <Link href="/admin/add-campaign"><button className="bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-lg shadow">+ Add New Promo</button></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b">
                    <th className="p-4 pl-6">Thumb (Home)</th>
                    <th className="p-4">Campaign Name</th>
                    <th className="p-4">Active Period</th>
                    <th className="p-4 text-center pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm font-medium">
                  {campaigns.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="p-4 pl-6">
                        <div className="relative w-12 h-12 bg-gray-150 rounded border overflow-hidden">
                          <img src={item.homeCoverUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        <div>{item.name}</div>
                        <div className="text-xs text-blue-500 font-normal">/promo/{item.slug}</div>
                      </td>
                      <td className="p-4 text-gray-500">{item.period}</td>
                      <td className="p-4 text-center pr-6 space-x-2 whitespace-nowrap">
                        <button onClick={() => openEditModal(item)} className="bg-gray-100 hover:bg-yellow-100 text-gray-700 py-1.5 px-4 rounded-lg text-xs font-bold">Edit</button>
                        <button onClick={() => handleDeleteCampaign(item.id, item.name)} className="bg-gray-100 hover:bg-red-100 text-gray-600 py-1.5 px-4 rounded-lg text-xs font-bold">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 📋 CAMPAIGN MODAL OVERLAY WITH SEPARATE FILE SELECTORS */}
        {editingCampaign && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="bg-gray-900 p-5 text-white flex justify-between items-center">
                <h3 className="font-black text-xl">Modify Active Campaign Metadata</h3>
                <button onClick={() => setEditingCampaign(null)} className="text-gray-400 hover:text-white text-xl font-bold bg-gray-800 h-8 w-8 rounded-full flex items-center justify-center">&times;</button>
              </div>

              <form onSubmit={handleUpdateCampaign} className="p-6 overflow-y-auto space-y-4 text-gray-700">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Campaign Name</label>
                  <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Promotion Running Period</label>
                  <input type="text" required value={editPeriod} onChange={(e) => setEditPeriod(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Linked Google Sheet ID</label>
                  <input type="text" required value={editSheetId} onChange={(e) => setEditSheetId(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Details Layout Paragraph</label>
                  <textarea required rows={4} value={editDetails} onChange={(e) => setEditDetails(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none whitespace-pre-line" />
                </div>

                {/* FILE EDIT SELECTOR 1: HOME PANEL */}
                <div className="border-t pt-4">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">1. Update Home Screen Cover (Square)</label>
                  <div className="flex items-center gap-4 p-2 border rounded-lg bg-gray-50">
                    <input type="file" accept="image/*" onChange={(e) => setEditHomeCoverFile(e.target.files?.[0] || null)} className="text-xs file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gray-800 file:text-white file:font-bold" />
                    <span className="text-xs text-gray-400 truncate">{editHomeCoverFile ? editHomeCoverFile.name : "Keeping original layout card"}</span>
                  </div>
                </div>

                {/* FILE EDIT SELECTOR 2: PROMO BANNER */}
                <div className="border-t pt-4">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">2. Update Wide Promo Page Banner (Horizontal)</label>
                  <div className="flex items-center gap-4 p-2 border rounded-lg bg-gray-50">
                    <input type="file" accept="image/*" onChange={(e) => setEditPromoBannerFile(e.target.files?.[0] || null)} className="text-xs file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gray-800 file:text-white file:font-bold" />
                    <span className="text-xs text-gray-400 truncate">{editPromoBannerFile ? editPromoBannerFile.name : "Keeping original layout banner"}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button type="button" onClick={() => setEditingCampaign(null)} className="py-2.5 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm">Cancel</button>
                  <button type="submit" disabled={isUpdatingCampaign} className="py-2.5 px-5 bg-blue-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">{isUpdatingCampaign ? "Saving assets..." : "Save Configuration"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}