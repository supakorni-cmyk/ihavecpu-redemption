// app/api/event-verify/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID; // Verify this matches your Event Sheet ID in .env
const SHEET_NAME = "Form Responses"; // Default Google Form response tab name

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
      range: `'${SHEET_NAME}'!A2:K`,
    });

    const rows = response.data.values || [];

    // Find row by email matching
    for (let i = 0; i < rows.length; i++) {
      const rowEmail = rows[i][5]?.toLowerCase().trim(); // Column F (index 5)

      if (rowEmail === email) {
        return NextResponse.json({
          found: true,
          rowIndex: i + 2, // +2 because header is row 1 and arrays are 0-indexed
          email: rows[i][5],
          name: rows[i][1] || "N/A",         // Column B (index 1)
          status: rows[i][10] || "NOT CLAIMED", // Column K (index 10)
        });
      }
    }

    return NextResponse.json({ found: false, message: "User registration not found." });

  } catch (error: unknown) {
    console.error("Event Lookup Error:", error);
    const message = error instanceof Error ? error.message : "Failed to lookup attendee";
    return NextResponse.json({ error: message }, { status: 500 });
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

    // Write "CLAIMED" directly into Column K of that user's row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!K${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["CLAIMED"]],
      },
    });

    return NextResponse.json({ success: true, message: "T-shirt marked as claimed successfully!" });

  } catch (error: unknown) {
    console.error("Event Claim Error:", error);
    const message = error instanceof Error ? error.message : "Failed to update claim status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}