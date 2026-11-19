// app/api/event-verify/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID_EVENT;
const TARGET_GID = 1030331899;

async function getSheetsInstance() {
  const formatPrivateKey = (key: string | undefined) => {
    if (!key) return undefined;
    return key.replace(/\\n/g, "\n").replace(/^"|"$/g, "");
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

// Convert 0-based column index to Google Sheets letter (e.g., 10 -> "K")
function indexToColumnLetter(index: number): string {
  let letter = "";
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// Resolve exact tab title using gid=1030331899
async function resolveSheetTitle(sheets: ReturnType<typeof google.sheets>) {
  if (!SPREADSHEET_ID) {
    throw new Error("Missing GOOGLE_SHEET_ID environment variable");
  }

  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties(sheetId,title)",
  });

  const allSheets = meta.data.sheets || [];
  const matchedSheet =
    allSheets.find((s) => s.properties?.sheetId === TARGET_GID) || allSheets[0];

  const title = matchedSheet?.properties?.title;
  if (!title) {
    throw new Error("No sheet tabs found in this spreadsheet");
  }

  return title;
}

// Auto-detect Name and Status column indexes from header row
function detectColumnIndexes(headers: string[]) {
  const lowerHeaders = headers.map((h) => (h || "").toLowerCase().trim());

  const nameIdx = lowerHeaders.findIndex(
    (h) =>
      (h.includes("name") || h.includes("ชื่อ")) &&
      !h.includes("nickname") &&
      !h.includes("ชื่อเล่น")
  );

  const statusIdx = lowerHeaders.findIndex(
    (h) => h.includes("status") || h.includes("claim") || h.includes("สถานะ")
  );

  return {
    nameCol: nameIdx !== -1 ? nameIdx : 1,       // Fallback: Column B
    statusCol: statusIdx !== -1 ? statusIdx : 10, // Fallback: Column K
  };
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
    const sheetTitle = await resolveSheetTitle(sheets);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetTitle}'!A1:Z`,
    });

    const allRows = response.data.values || [];
    const headers = allRows[0] || [];
    const dataRows = allRows.slice(1);
    const { nameCol, statusCol } = detectColumnIndexes(headers);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] || [];

      // Match email in ANY column of the row
      const matchedEmailCell = row.find(
        (cell) => typeof cell === "string" && cell.toLowerCase().trim() === email
      );

      if (matchedEmailCell) {
        return NextResponse.json({
          found: true,
          rowIndex: i + 2, // +2 because row 1 is headers and dataRows is 0-indexed
          email: matchedEmailCell.trim(),
          name: row[nameCol] || row[1] || row[2] || "N/A",
          status: row[statusCol] || "NOT CLAIMED",
        });
      }
    }

    return NextResponse.json({
      found: false,
      message: "User registration not found.",
    });
  } catch (error: unknown) {
    console.error("Event Lookup Error:", error);
    const message = error instanceof Error ? error.message : "Failed to lookup attendee";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 👕 MARK T-SHIRT AS CLAIMED & BROADCAST TO USER SCREEN
export async function POST(req: Request) {
  try {
    const { rowIndex, email, name } = await req.json();

    if (!rowIndex) {
      return NextResponse.json({ error: "Row index is required" }, { status: 400 });
    }

    const sheets = await getSheetsInstance();
    const sheetTitle = await resolveSheetTitle(sheets);

    // Check headers to ensure we write to the exact Status column (defaults to K)
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetTitle}'!A1:Z1`,
    });
    const headers = headerRes.data.values?.[0] || [];
    const { statusCol } = detectColumnIndexes(headers);
    const statusColLetter = indexToColumnLetter(statusCol);

    // 1. Update Google Sheets
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetTitle}'!${statusColLetter}${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["CLAIMED"]],
      },
    });

    // 2. Push real-time update to Firestore so the user's screen updates immediately
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      await setDoc(
        doc(db, "checkins", normalizedEmail),
        {
          email: normalizedEmail,
          name: name || "Attendee",
          status: "CLAIMED",
          verifiedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: "T-shirt marked as claimed successfully!",
    });
  } catch (error: unknown) {
    console.error("Event Claim Error:", error);
    const message = error instanceof Error ? error.message : "Failed to update claim status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}