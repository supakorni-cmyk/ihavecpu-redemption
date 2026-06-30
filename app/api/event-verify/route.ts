// app/api/event-verify/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID_EVENT; // Add this to your environment variables!

async function getSheetsInstance() {
  const formatPrivateKey = (key: string | undefined) => {
    if (!key) return undefined;
    return key.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
  };

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

// 🔍 LOOKUP ATTENDEE BY EMAIL
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 });
    }

    const sheets = await getSheetsInstance();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Form Responses 1!A2:I", // Adjust tab name if yours is different
    });

    const rows = response.data.values || []; searchParams
    
    // Find row by email matching
    for (let i = 0; i < rows.length; i++) {
      const rowEmail = rows[i][5]?.toLowerCase().trim(); // Column F
      
      if (rowEmail === email) {
        return NextResponse.json({
          found: true,
          rowIndex: i + 2, // +2 because we skipped header row (A1) and arrays are 0-indexed
          email: rows[i][5],
          name: rows[i][1] || "N/A", // Column C
          status: rows[i][8] || "NOT CLAIMED", // Column E
        });
      }
    }

    return NextResponse.json({ found: false, message: "User registration not found." });

  } catch (error: any) {
    console.error("Event Lookup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 👕 MARK T-SHIRT AS CLAIMED
export async function POST(req: Request) {
  try {
    const { rowIndex } = await req.json();

    if (!rowIndex) {
      return NextResponse.json({ error: "Row index is required" }, { status: 400 });
    }

    const sheets = await getSheetsInstance();

    // Write "CLAIMED" directly into Column I (9th index) of that user's row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Form Responses 1!I${rowIndex}`, 
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["CLAIMED"]],
      },
    });

    return NextResponse.json({ success: true, message: "T-shirt marked as claimed successfully!" });

  } catch (error: any) {
    console.error("Event Claim Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}