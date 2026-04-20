// app/api/get-prizes/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

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
    const spreadsheetId = process.env.GOOGLE_SHEET_ID_PRIZES as string;

    // Read Column A from Sheet1 (Change "Sheet1" if your tab is named differently)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A2:A",
    });

    const rows = response.data.values || [];
    
    // Flatten the rows into a simple array of strings and filter out empty cells
    const prizes = rows.map((row) => row[0]).filter(Boolean);

    return NextResponse.json({ prizes });
  } catch (error: unknown) {
    console.error("Get Prizes Error:", error);
    return NextResponse.json({ error: "Failed to fetch prizes" }, { status: 500 });
  }
}