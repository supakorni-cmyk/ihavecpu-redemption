// app/api/dispense-code/route.ts
import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";

// 1. Properly typed helper function for Tales Runner
async function getAndMarkCode(
  sheets: sheets_v4.Sheets, 
  spreadsheetId: string, 
  sheetName: string, 
  email: string
) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:B`, 
  });

  const rows = response.data.values || [];
  let targetRowIndex = -1;
  let targetCode = null;

  for (let i = 0; i < rows.length; i++) {
    if (!rows[i][1]) { 
      targetRowIndex = i + 2; 
      targetCode = rows[i][0];
      break;
    }
  }

  if (!targetCode) {
    throw new Error(`No codes available in the ${sheetName} tab!`);
  }

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
    const { email, promo } = await req.json();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"|"$/g, ''),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 🔴 IF PROMO IS INTEL (Safely checks if the promo name contains "Intel"):
    if (promo && promo.includes("Intel")) {
      const spreadsheetId = process.env.GOOGLE_SHEET_ID_INTEL_GD26 as string;
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!A2:B", 
      });

      const rows = response.data.values || [];
      
      // 1. Collect ALL available rows (where Column B is empty)
      const availableRows = [];
      for (let i = 0; i < rows.length; i++) {
        if (!rows[i][1]) { 
          availableRows.push({
            rowIndex: i + 2, // FIXED: Must be i + 2 because we start at row 2!
            code: rows[i][0],     
          });
        }
      }

      // 2. If no rows are left, throw an error
      if (availableRows.length === 0) {
        throw new Error("No Master Key available!");
      }

      // 3. Pick one completely at RANDOM
      const randomIndex = Math.floor(Math.random() * availableRows.length);
      const selectedRow = availableRows[randomIndex];

      // 4. Update that specific random row with the user's email
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!B${selectedRow.rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[email]] },
      });

      // 5. Return the randomly selected code!
      return NextResponse.json({ 
        code1: selectedRow.code
      }); 
    }
    
    // 🔵 DEFAULT (TALES RUNNER):
    else {
      const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;
      const code1 = await getAndMarkCode(sheets, spreadsheetId, "Item1", email);
      // const code2 = await getAndMarkCode(sheets, spreadsheetId, "Item2", email);
      return NextResponse.json({ code1 });
    }

  // 2. Safely type the error block
  } catch (error: unknown) { 
    console.error("API Error:", error);
    
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}