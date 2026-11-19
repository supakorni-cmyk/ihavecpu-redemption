// app/api/event-verify/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID_EVENT;
const TARGET_GID = 1030331899; // From your sheet URL (#gid=1030331899)

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

// Resolve the exact tab name automatically using its gid (1030331899)
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
    throw new Error("Could not find any sheet tab in this spreadsheet");
  }

  return title;
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
      range: `'${sheetTitle}'!A2:K`,
    });

    const rows = response.data.values || [];

    for (let i = 0; i < rows.length; i++) {
      const rowEmail = rows[i][5]?.toLowerCase().trim(); // Column F[cite: 7]

      if (rowEmail === email) {
        return NextResponse.json({
          found: true,
          rowIndex: i + 2, // +2 because header is row 1 and arrays are 0-indexed[cite: 7]
          email: rows[i][5],
          name: rows[i][1] || "N/A", // Column B[cite: 7]
          status: rows[i][10] || "NOT CLAIMED", // Column K[cite: 7]
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
    const sheetTitle = await resolveSheetTitle(sheets);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetTitle}'!K${rowIndex}`,
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