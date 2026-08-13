// app/api/get-messages/route.ts
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
    const spreadsheetId = process.env.GOOGLE_SHEET_ID_EVENT as string;

    // Adjust "Form Responses 1!A2:G" range to cover your message columns
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Form Responses'!A2:K", 
    });

    const rows = response.data.values || [];
    
    // ⚠️ ADJUST COLUMN INDEXES ACCORDING TO YOUR GOOGLE FORM SHEET:
    // row[4] = Message ("Say something about MSI and iHAVECPU")
    // row[5] = Signature / Name ("Sign")
    const messages = rows
      .map((row) => ({
        text: row[6] || "", 
        sign: row[7] || "", 
      }))
      .filter((item) => item.text.trim() !== "");

    return NextResponse.json({ messages });
  } catch (error: unknown) {
    console.error("Get Messages Error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}