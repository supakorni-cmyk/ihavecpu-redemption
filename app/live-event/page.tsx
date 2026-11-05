/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

// 🛑 EXPLICIT / PROFANITY WORD FILTER LIST (Thai & English)
const EXPLICIT_WORDS = [
  // Thai
  "ควย", "เหี้ย", "เชี่ย", "สัด", "สัส", "เย็ด", "กู", "มึง", "แม่ง", 
  "ชิปหาย", "ฉิบหาย", "ตีน", "ส้นตีน", "กวนตีน", "แฮก", "ค_ย", "เxี้ย", "หี", "แตด",
  // English
  "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy", 
  "bastard", "slut", "whore", "nigger", "faggot"
];

const isExplicit = (text: string): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return EXPLICIT_WORDS.some((word) => lower.includes(word.toLowerCase()));
};

// 🎯 8 PRE-DEFINED NON-OVERLAPPING SLOTS (4 Left / 4 Right)
const SPATIAL_SLOTS = [
  // Left Flank Slots
  { top: 12, left: 2 },
  { top: 32, left: 4 },
  { top: 52, left: 2 },
  { top: 72, left: 3 },
  // Right Flank Slots
  { top: 12, left: 81 },
  { top: 32, left: 83 },
  { top: 52, left: 80 },
  { top: 72, left: 82 },
];

type PrizeItem = {
  name: string;
  image?: string;
  value?: string;
  supporter?: string;
};

type FloatingMessage = {
  id: string;
  text: string;
  sign: string;
  top: number;
  left: number;
  delay: number;
  duration: number;
  scale: number;
};

export default function LiveEventDisplayBoard() {
  const [winnerNames, setWinnerNames] = useState<string[]>([]);
  const [prize, setPrize] = useState<string | null>(null);
  const [prizeSupporter, setPrizeSupporter] = useState<string | null>(null);
  const [prizeImage, setPrizeImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGrandPrize, setIsGrandPrize] = useState(false);
  
  const [shufflingName, setShufflingName] = useState("???");
  const [realNamesPool, setRealNamesPool] = useState<string[]>(["กำลังโหลดรายชื่อ...", "Loading..."]);

  // 💬 Floating Messages State
  const [floatingMessages, setFloatingMessages] = useState<FloatingMessage[]>([]);

  // 🎁 Auto-Slide Prize Carousel States
  const [allPrizes, setAllPrizes] = useState<PrizeItem[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

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

  // 🎁 Fetch Prizes for Waiting Carousel
  const fetchAllPrizes = async () => {
    try {
      const res = await fetch("/api/get-prizes");
      const data = await res.json();
      if (data.prizes && data.prizes.length > 0) {
        setAllPrizes(data.prizes);
      }
    } catch (error) {
      console.error("Failed to load prizes for carousel", error);
    }
  };

  // 💬 Fetch Google Form Messages, Filter Explicit Words & Randomize Selection
  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/get-messages");
      const data = await res.json();
      
      if (data.messages && data.messages.length > 0) {
        // 1. Filter out profane or explicit content
        const cleanMessages = data.messages.filter(
          (m: { text: string; sign: string }) => !isExplicit(m.text) && !isExplicit(m.sign)
        );

        if (cleanMessages.length > 0) {
          // 2. Randomize/Shuffle the entire array of messages
          const shuffled = [...cleanMessages].sort(() => Math.random() - 0.5);

          // 3. Take up to 8 random messages for the 8 slots
          const randomSelection = shuffled.slice(0, SPATIAL_SLOTS.length);

          const scheduled: FloatingMessage[] = randomSelection.map(
            (m: { text: string; sign: string }, index: number) => {
              const slot = SPATIAL_SLOTS[index];
              return {
                id: `msg-${Date.now()}-${index}`,
                text: m.text,
                sign: m.sign,
                top: slot.top,
                left: slot.left,
                delay: index * 0.3,
                duration: 12 + (index % 3),
                scale: 0.95,
              };
            }
          );

          setFloatingMessages(scheduled);
        }
      }
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  useEffect(() => {
    fetchParticipants();
    fetchAllPrizes();
    fetchMessages();

    // 🎲 Rotate with a new random batch of messages every 6 seconds
    const messageInterval = setInterval(fetchMessages, 6000);
    return () => clearInterval(messageInterval);
  }, []);

  // ⏱️ Auto-advance prize carousel every 3.5 seconds
  useEffect(() => {
    if (allPrizes.length <= 1) return;
    const slideTimer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % allPrizes.length);
    }, 3500);
    return () => clearInterval(slideTimer);
  }, [allPrizes.length]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "events", "event-lucky-draw"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWinnerNames(data.currentWinners || []);
        setPrize(data.prize);
        setPrizeSupporter(data.prizeSupporter || null);
        setPrizeImage(data.prizeImage || null);
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

  const activeShowcasePrize = allPrizes[currentSlideIndex];

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden select-none">
      
      {/* 🌟 CSS Keyframe Animations */}
      <style jsx global>{`
        @keyframes gentleFloat {
          0% {
            transform: translateY(0px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-12px);
            opacity: 0.95;
          }
          100% {
            transform: translateY(0px);
            opacity: 0.5;
          }
        }
        @keyframes fadeInCard {
          from {
            opacity: 0;
            transform: scale(0.7);
          }
          to {
            opacity: 1;
            transform: scale(0.95);
          }
        }
        @keyframes slideFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      {/* Background Banner */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Image src="/event-banner.jpg" alt="Background" fill className="object-cover blur-sm" />
        <div className={`absolute inset-0 transition-colors duration-700 ${isGrandPrize && (isDrawing || winnerNames.length > 0) ? 'bg-gradient-to-b from-yellow-900/80 via-red-900/80 to-gray-900' : 'bg-gradient-to-b from-gray-900/80 to-gray-900'}`} />
      </div>

      {/* 💬 SIDE FLANK FLOATING MESSAGES (Randomized Batch Every 6s) */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {floatingMessages.map((msg) => (
          <div
            key={msg.id}
            style={{
              top: `${msg.top}%`,
              left: `${msg.left}%`,
              animation: `fadeInCard 0.8s ease-out, gentleFloat ${msg.duration}s ease-in-out ${msg.delay}s infinite`,
            }}
            className="absolute max-w-[200px] md:max-w-[260px] bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-2.5 rounded-2xl shadow-lg text-white transition-all duration-700"
          >
            <p className="text-xs md:text-sm font-medium italic text-red-200 leading-snug drop-shadow">
              "{msg.text}"
            </p>
            <p className="text-[11px] font-bold text-gray-300 text-right mt-1 font-mono">
              — {msg.sign}
            </p>
          </div>
        ))}
      </div>

      {/* Main Header Title */}
      <div className="relative z-20 p-10 text-center mt-6">
        <span className={`inline-block py-2 px-6 rounded-full text-white text-lg font-bold tracking-widest uppercase mb-4 shadow-lg animate-pulse ${isGrandPrize ? 'bg-yellow-500' : 'bg-red-500'}`}>
          Live Lucky Draw
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl">
          iHAVECPU
        </h1>
        <h2 className={`text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-2xl text-red-500`}>
          CHIANG MAI
        </h2>
      </div>

      {/* Main Stage Interactive Card */}
      <div className="relative z-20 flex-grow flex items-center justify-center p-4">
        <div className={`w-full max-w-5xl backdrop-blur-lg border p-8 md:p-14 rounded-3xl shadow-2xl text-center transition-all duration-500 ${isGrandPrize ? 'bg-black/50 border-yellow-500/50 scale-105' : 'bg-black/40 border-white/20'}`}>
          
          {/* ----------------- STATE 1: DRAWING / SHUFFLING ----------------- */}
          {isDrawing ? (
            <div className={`flex flex-col items-center justify-center ${isGrandPrize ? 'scale-105' : ''}`}>
              {isGrandPrize && <div className="text-7xl mb-4 animate-bounce">🚨</div>}
              <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${isGrandPrize ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]' : 'text-red-400'}`}>
                {isGrandPrize ? "กำลังสุ่มรางวัลใหญ่สุดพิเศษ!" : "กำลังสุ่มผู้โชคดี..."}
              </h2>
              
              {/* Prize Image Box during Drawing */}
              {prizeImage && (
                <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto mb-6 bg-white/10 rounded-2xl border border-white/20 p-4 shadow-2xl flex items-center justify-center overflow-hidden">
                  <Image src={prizeImage} alt={prize || "Prize"} fill className="object-contain drop-shadow-lg" />
                </div>
              )}

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
                isGrandPrize ? 'border-yellow-400/70 bg-yellow-500/10 shadow-[0_0_30px_rgba(250,204,21,0.3)]' : 'border-red-400/70 bg-red-500/10 shadow-[0_0_30px_rgba(220,38,38,0.3)]'
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

              {prizeImage && (
                <div className="relative w-56 h-56 md:w-72 md:h-72 mx-auto my-4 bg-white/10 rounded-2xl border border-white/20 p-4 shadow-2xl flex items-center justify-center overflow-hidden">
                  <Image src={prizeImage} alt={prize || "Prize"} fill className="object-contain drop-shadow-2xl" />
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
                    <h2 className={`text-4xl md:text-5xl font-black text-white whitespace-nowrap drop-shadow-md bg-clip-text text-transparent truncate px-2 ${isGrandPrize ? 'bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'bg-gradient-to-r from-red-300 to-red-500'}`}>
                      {name}
                    </h2>
                  </div>
                ))}
              </div>
              
              <p className={`text-3xl mt-4 font-bold ${isGrandPrize ? 'text-yellow-400' : 'text-white'}`}>ขอแสดงความยินดีด้วยครับ! 🎉</p>
            </div>
          ) : (

            /* ----------------- STATE 3: WAITING / IDLE (AUTO SLIDE PRIZES) ----------------- */
            <div className="flex flex-col items-center">
              
              {/* 🎁 AUTO-SLIDING PRIZE SHOWCASE CARD */}
              {activeShowcasePrize ? (
                <div 
                  key={`slide-${currentSlideIndex}`}
                  style={{ animation: "slideFadeIn 0.5s ease-out" }}
                  className="w-full max-w-lg bg-gradient-to-b from-white/15 to-white/5 border border-white/20 rounded-3xl p-6 shadow-2xl mb-6 relative overflow-hidden backdrop-blur-md"
                >
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-300 rounded-full">
                      🎁 Featured Prize ({currentSlideIndex + 1}/{allPrizes.length})
                    </span>
                    {activeShowcasePrize.supporter && (
                      <span className="text-xs font-semibold text-gray-300 italic">
                        By {activeShowcasePrize.supporter}
                      </span>
                    )}
                  </div>

                  {/* Prize Image Container */}
                  <div className="relative w-full h-44 md:h-52 my-2 flex items-center justify-center">
                    {activeShowcasePrize.image ? (
                      <Image 
                        src={activeShowcasePrize.image} 
                        alt={activeShowcasePrize.name} 
                        fill 
                        className="object-contain drop-shadow-2xl" 
                      />
                    ) : (
                      <div className="text-6xl animate-pulse">🎁</div>
                    )}
                  </div>

                  {/* Prize Name */}
                  <h3 className="text-xl md:text-2xl font-black text-white mt-1 drop-shadow tracking-wide truncate px-2">
                    {activeShowcasePrize.name}
                  </h3>

                  {/* Indicator Dots */}
                  {allPrizes.length > 1 && (
                    <div className="flex justify-center items-center gap-1.5 mt-4">
                      {allPrizes.map((_, dotIdx) => (
                        <div
                          key={dotIdx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            dotIdx === currentSlideIndex 
                              ? "w-6 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" 
                              : "w-1.5 bg-white/30"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback loading state */
                <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto mb-6 p-4 flex items-center justify-center">
                  <div className="text-7xl animate-pulse">🎁</div>
                </div>
              )}

              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">เตรียมตัวให้พร้อม!</h2>
                <p className="text-lg md:text-xl text-gray-300">รอลุ้นรับรางวัลจากทาง iHAVECPU เร็วๆ นี้</p>
                <p className="text-sm text-gray-500 mt-4 opacity-50">
                  (Participants ready: {realNamesPool.length > 2 ? realNamesPool.length : 0})
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}