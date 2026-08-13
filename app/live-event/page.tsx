/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function RayongDisplayBoard() {
  const [winnerNames, setWinnerNames] = useState<string[]>([]); 
  const [prize, setPrize] = useState<string | null>(null);
  const [prizeSupporter, setPrizeSupporter] = useState<string | null>(null); 
  const [prizeImage, setPrizeImage] = useState<string | null>(null); // 🖼️ NEW: Prize Image State
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGrandPrize, setIsGrandPrize] = useState(false); 
  
  const [shufflingName, setShufflingName] = useState("???");
  const [realNamesPool, setRealNamesPool] = useState<string[]>(["กำลังโหลดรายชื่อ...", "Loading..."]);

  const fetchParticipants = async () => {
    try {
      const res = await fetch("/api/get-participants");
      const data = await res.json();
      if (data.participants && data.participants.length > 0) {
        setRealNamesPool(data.participants);
      }
    } catch (error) {
      console.error("Failed to load names for shuffle", error);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "events", "event-lucky-draw"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWinnerNames(data.currentWinners || []); 
        setPrize(data.prize);
        setPrizeSupporter(data.prizeSupporter || null); 
        setPrizeImage(data.prizeImage || null); // 🖼️ Listen to prizeImage in Firestore
        setIsDrawing(data.isDrawing);
        setIsGrandPrize(data.isGrandPrize || false); 
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isDrawing) {
      fetchParticipants();
    }
  }, [isDrawing]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDrawing && realNamesPool.length > 0) {
      interval = setInterval(() => {
        const randomName = realNamesPool[Math.floor(Math.random() * realNamesPool.length)];
        setShufflingName(randomName);
      }, 70); 
    } else {
      setShufflingName("???");
    }
    return () => clearInterval(interval);
  }, [isDrawing, realNamesPool]);

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-40">
        <Image src="/live-event-banner.jpg" alt="Background" fill className="object-cover blur-sm" />
        <div className={`absolute inset-0 transition-colors duration-700 ${isGrandPrize && (isDrawing || winnerNames.length > 0) ? 'bg-gradient-to-b from-yellow-900/80 via-red-900/80 to-gray-900' : 'bg-gradient-to-b from-gray-900/80 to-gray-900'}`} />
      </div>

      <div className="relative z-10 p-10 text-center mt-10">
        <span className={`inline-block py-2 px-6 rounded-full text-white text-lg font-bold tracking-widest uppercase mb-6 shadow-lg animate-pulse ${isGrandPrize ? 'bg-yellow-500' : 'bg-red-500'}`}>
          Live Lucky Draw
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl">
          iHAVECPU X MSI
        </h1>
        <h2 className={`text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-2xl text-amber-500`}>
          BRAND DAY 40TH Anniversary
        </h2>
      </div>

      <div className="relative z-10 flex-grow flex items-center justify-center p-4">
        <div className={`w-full max-w-5xl backdrop-blur-md border p-8 md:p-16 rounded-3xl shadow-2xl text-center transition-all duration-500 ${isGrandPrize ? 'bg-black/40 border-yellow-500/50 scale-105' : 'bg-white/10 border-white/20'}`}>
          
          {/* ----------------- STATE 1: DRAWING / SHUFFLING ----------------- */}
          {isDrawing ? (
            <div className={`flex flex-col items-center justify-center ${isGrandPrize ? 'scale-105' : ''}`}>
              {isGrandPrize && <div className="text-7xl mb-4 animate-bounce">🚨</div>}
              <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${isGrandPrize ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]' : 'text-red-400'}`}>
                {isGrandPrize ? "กำลังสุ่มรางวัลใหญ่สุดพิเศษ!" : "กำลังสุ่มผู้โชคดี..."}
              </h2>
              
              {/* 🖼️ Prize Image Box during Drawing */}
              {prizeImage && (
                <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto mb-6 bg-white/10 rounded-2xl border border-white/20 p-4 shadow-2xl flex items-center justify-center overflow-hidden">
                  <img src={prizeImage} alt={prize || "Prize"} className="max-w-full max-h-full object-contain drop-shadow-lg" />
                </div>
              )}

              {/* Show Static Prize Name & Supporter while drawing */}
              <div className="mb-8 space-y-2">
                <p className={`text-4xl md:text-5xl font-extrabold tracking-widest ${isGrandPrize ? 'text-yellow-300 drop-shadow-md' : 'text-white'}`}>
                  {prize || "รางวัลพิเศษ"}
                </p>
                {prizeSupporter && (
                   <p className={`text-xl italic font-semibold ${isGrandPrize ? 'text-yellow-300' : 'text-white/80'}`}>
                      Supported by {prizeSupporter}
                   </p>
                )}
              </div>
              
              <div className={`w-full max-w-2xl mx-auto py-8 px-4 rounded-2xl border-4 border-dashed transition-colors duration-200 ${
                isGrandPrize ? 'border-yellow-400/70 bg-yellow-500/10 shadow-[0_0_30px_rgba(250,204,21,0.3)]' : 'border-red-400/70 bg-red-500/10 shadow-[0_0_30px_rgba(248,113,113,0.3)]'
              }`}>
                <h3 className={`text-5xl md:text-6xl font-black italic whitespace-nowrap tracking-wider opacity-90 blur-[1px] truncate px-4 ${isGrandPrize ? 'text-yellow-200' : 'text-white'}`}>
                  {shufflingName}
                </h3>
              </div>
            </div>
          ) : winnerNames.length > 0 ? (

            /* ----------------- STATE 2: WINNER REVEALED ----------------- */
            <div className="animate-bounce-short flex flex-col items-center">
              {isGrandPrize && <div className="text-8xl mb-6 animate-bounce">👑</div>}
              <p className={`text-2xl font-bold uppercase tracking-widest mb-2 ${isGrandPrize ? 'text-yellow-300' : 'text-red-300'}`}>
                ผู้โชคดีได้รับ 
              </p>

              {/* 🖼️ Prize Image Box on Reveal */}
              {prizeImage && (
                <div className="relative w-56 h-56 md:w-72 md:h-72 mx-auto my-4 bg-white/10 rounded-2xl border border-white/20 p-4 shadow-2xl flex items-center justify-center overflow-hidden">
                  <img src={prizeImage} alt={prize || "Prize"} className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                </div>
              )}

              <p className={`text-3xl md:text-4xl font-bold tracking-widest mb-1 ${isGrandPrize ? 'text-yellow-400 drop-shadow-md' : 'text-white'}`}>
                {prize || "รางวัลพิเศษ"}
              </p>
              
              <div className="mb-8 space-y-2">
                 {prizeSupporter && (
                   <p className={`text-xl italic font-semibold ${isGrandPrize ? 'text-yellow-300' : 'text-white/80'}`}>
                      Supported by {prizeSupporter}
                   </p>
                 )}
              </div>
              
              <div className={`grid gap-6 ${winnerNames.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} mb-8 w-full`}>
                {winnerNames.map((name, index) => (
                  <div key={index} className={`rounded-2xl py-6 px-4 border shadow-inner ${isGrandPrize ? 'bg-gradient-to-r from-yellow-500/20 to-red-500/20 border-yellow-400/50' : 'bg-white/10 border-white/20'}`}>
                    <h2 className={`text-4xl md:text-5xl font-black text-white whitespace-nowrap drop-shadow-md bg-clip-text text-transparent truncate px-2 ${isGrandPrize ? 'bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'bg-gradient-to-r from-orange-300 to-yellow-500'}`}>
                      {name}
                    </h2>
                  </div>
                ))}
              </div>
              
              <p className={`text-3xl mt-4 font-bold ${isGrandPrize ? 'text-yellow-400' : 'text-white'}`}>ขอแสดงความยินดีด้วยครับ! 🎉</p>
            </div>
          ) : (

            /* ----------------- STATE 3: WAITING / IDLE ----------------- */
            <div>
              <div className="text-8xl mb-6">🎁</div>
              <h2 className="text-4xl font-bold text-white mb-4">เตรียมตัวให้พร้อม!</h2>
              <p className="text-xl text-gray-300">รอลุ้นรับรางวัลใหญ่จากทาง iHAVECPU เร็วๆ นี้</p>
              <p className="text-sm text-gray-500 mt-6 opacity-50">
                (Participants ready: {realNamesPool.length > 2 ? realNamesPool.length : 0})
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}