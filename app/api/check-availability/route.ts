// app/api/check-availability/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const formatPrivateKey = (key: string | undefined) => {
      if (!key) return undefined;
      return key.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
    };

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"], // Read-only access
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;

    // We check the "Item1" tab. If Item1 is out of codes, the promo is over.
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Item1!A2:B", 
    });

    const rows = response.data.values || [];
    let isAvailable = false;

    // Search for any row where Column B (Used By) is empty
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i][1]) { 
        isAvailable = true;
        break;
      }
    }

    return NextResponse.json({ available: isAvailable });

  } catch (error) {
    console.error("Availability Check Error:", error);
    return NextResponse.json({ available: false, error: "Failed to check status" }, { status: 500 });
  }
}