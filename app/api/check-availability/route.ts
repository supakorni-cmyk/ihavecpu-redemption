// app/api/check-availability/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Grab the URL parameters
    const { searchParams } = new URL(req.url);
    const promo = searchParams.get("promo");

    const formatPrivateKey = (key: string | undefined) => {
      if (!key) return undefined;
      return key.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
    };

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 🔴 IF PROMO IS NVIDIA
    if (promo === "nvidia") {
      const spreadsheetId = process.env.GOOGLE_SHEET_ID_NVIDIA as string;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!A2:C", 
      });

      const rows = response.data.values || [];
      let isAvailable = false;

      // In NVIDIA, Column C (index 2) holds the email
      for (let i = 0; i < rows.length; i++) {
        if (!rows[i][2]) { 
          isAvailable = true;
          break;
        }
      }
      return NextResponse.json({ available: isAvailable });
    } 
    
    // 🔵 DEFAULT: TALES RUNNER
    else {
      const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Item1!A2:B", 
      });

      const rows = response.data.values || [];
      let isAvailable = false;

      // In Tales Runner, Column B (index 1) holds the email
      for (let i = 0; i < rows.length; i++) {
        if (!rows[i][1]) { 
          isAvailable = true;
          break;
        }
      }
      return NextResponse.json({ available: isAvailable });
    }

  } catch (error) {
    console.error("Availability Check Error:", error);
    return NextResponse.json({ available: false, error: "Failed to check status" }, { status: 500 });
  }
}