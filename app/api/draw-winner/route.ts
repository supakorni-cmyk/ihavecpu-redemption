// app/api/draw-rayong-winner/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    let qty = 1;
    let prizeName = "Unknown Prize"; // <-- Default prize name
    
    try {
      const body = await req.json();
      if (body.qty && typeof body.qty === 'number' && body.qty > 0) {
        qty = body.qty;
      }
      if (body.prizeName) {
        prizeName = body.prizeName; // <-- Get prize name from body
      }
    } catch (e) {
      // Ignore if no body is passed
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"|"$/g, ''),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID_EVENT as string;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Form Responses 1'!A2:G", 
    });

    const rows = response.data.values || [];
    const availableParticipants = [];
    
    for (let i = 0; i < rows.length; i++) {
      const name = rows[i][1];
      const winnerStatus = rows[i][6];

      if (name && !winnerStatus) { 
        availableParticipants.push({
          rowIndex: i + 2,
          name: name
        });
      }
    }

    if (availableParticipants.length === 0) {
      return NextResponse.json({ error: "No participants left to draw!" }, { status: 400 });
    }
    if (availableParticipants.length < qty) {
      return NextResponse.json({ error: `Not enough people! Only ${availableParticipants.length} left.` }, { status: 400 });
    }

    const shuffled = availableParticipants.sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, qty);

    // Update BOTH Column G (WINNER status) and Column H (Prize Name)
    const updateData = winners.map(winner => ({
      range: `'Form Responses 1'!G${winner.rowIndex}:H${winner.rowIndex}`, // <-- Range covers G and H
      values: [["WINNER", prizeName]] // <-- Write both values
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updateData
      }
    });

    const winnerNames = winners.map(w => w.name);
    return NextResponse.json({ winnerNames });

  } catch (error: unknown) {
    console.error("Draw Error:", error);
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}