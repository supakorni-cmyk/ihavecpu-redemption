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

    // Fetch Columns A through E (E is the 5th column)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A2:E",
    });

    const rows = response.data.values || [];
    
    // Map into an array of objects holding name, value (Col D), and supporter (Col E)
    const prizes = rows
      .filter(row => row[0]) 
      .map((row) => ({
        name: row[0],
        value: row[3] || "",     // Column D is index 3
        supporter: row[4] || "",  // Column E is index 4
        image: row[7] || ""  // Column H is index 7
      }));

    return NextResponse.json({ prizes });
  } catch (error: unknown) {
    console.error("Get Prizes Error:", error);
    return NextResponse.json({ error: "Failed to fetch prizes" }, { status: 500 });
  }
}