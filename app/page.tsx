// app/page.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen p-10 flex flex-col items-center bg-gray-50 text-black">
      <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-6">Game Item Redemption</h1>

        {!session ? (
          <div>
            <p className="mb-4">Please log in with your Gmail to claim items.</p>
            <button
              onClick={() => signIn("google")}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-6">Welcome, {session.user?.email}</p>
            
            <h2 className="text-xl font-semibold mb-4 text-left border-b pb-2">Active Promotions</h2>
            
            {/* Tales Runner Promo Card */}
            <div className="border rounded-md p-4 flex justify-between items-center text-left">
              <div>
                <h3 className="text-lg font-bold">Tales Runner Exclusive Item</h3>
                <p className="text-sm text-gray-600">Upload your receipt to claim.</p>
              </div>
              <Link href="/tales-runner">
                <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                  Redeem Now
                </button>
              </Link>
            </div>

            <button
              onClick={() => signOut()}
              className="mt-8 text-sm text-gray-500 hover:underline"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </main>
  );
}