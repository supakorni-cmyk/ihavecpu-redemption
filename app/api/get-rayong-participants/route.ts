// app/api/get-rayong-participants/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

// ⚠️ Crucial: This tells Next.js NOT to cache this response, so it always gets fresh names!
export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"|"$/g, ''),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID_RAYONG as string;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Form Responses 1'!A2:G",
    });

    const rows = response.data.values || [];
    const participants = [];

    // Filter out people who already won (Column G)
    for (let i = 0; i < rows.length; i++) {
      const name = rows[i][1];
      const winnerStatus = rows[i][6];
      if (name && !winnerStatus) {
        participants.push(name);
      }
    }

    return NextResponse.json({ participants });
  } catch (error: unknown) {
    console.error("Fetch Participants Error:", error);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}