// app/api/dispense-code/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

// Helper function to find and mark a code in a specific tab
async function getAndMarkCode(sheets: any, spreadsheetId: string, sheetName: string, email: string) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:B`, 
  });

  const rows = response.data.values || [];
  let targetRowIndex = -1;
  let targetCode = null;

  // Find the first empty "Used By" cell
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i][1]) { // If Column B is empty
      targetRowIndex = i + 2; // +2 because array is 0-indexed and row 1 is headers
      targetCode = rows[i][0];
      break;
    }
  }

  if (!targetCode) {
    throw new Error(`No codes available in the ${sheetName} tab!`);
  }

  // Mark as used
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!B${targetRowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[email]] },
  });

  return targetCode;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const formatPrivateKey = (key: string | undefined) => {
      if (!key) return undefined;
      // This removes extra quotes and fixes the newline characters
      return key.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
    };

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;

    // ADD THIS DEBUG LINE HERE:
    console.log("DEBUG: Looking for Sheet ID:", spreadsheetId);

    // Change "Item1" and "Item2" to match the exact names of your tabs at the bottom of Google Sheets
    const code1 = await getAndMarkCode(sheets, spreadsheetId, "Item1", email);
    const code2 = await getAndMarkCode(sheets, spreadsheetId, "Item2", email);

    // Return both codes securely to the frontend
    return NextResponse.json({ code1, code2 });

} catch (error: any) {
    // This will print the EXACT Google error details in your VS Code terminal
    console.error("🔥 DETAILED GOOGLE ERROR:", error.response?.data?.error || error.message);
    
    return NextResponse.json(
      { error: error.response?.data?.error?.message || error.message || "Failed to connect to Google Sheets" }, 
      { status: 500 }
    );
  }
}