// app/api/draw-rayong-winner/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"|"$/g, ''),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID_RAYONG as string;

    // 1. Fetch columns A through G from the Google Form sheet
    // We use single quotes around 'Form Responses 1' because it contains spaces
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Form Responses 1'!A2:G", 
    });

    const rows = response.data.values || [];
    
    const availableParticipants = [];
    
    for (let i = 0; i < rows.length; i++) {
      // In Google Forms:
      // rows[i][1] is Column B (Name)
      // rows[i][6] is Column G (Where we will put "WINNER")
      const name = rows[i][1];
      const winnerStatus = rows[i][6];

      // If the row has a name AND Column G is empty, they are eligible!
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

    // 2. Pick a random winner
    const randomIndex = Math.floor(Math.random() * availableParticipants.length);
    const winner = availableParticipants[randomIndex];

    // 3. Mark them as "WINNER" in Column G so they can't be drawn again
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'Form Responses 1'!G${winner.rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["WINNER"]] },
    });

    return NextResponse.json({ winnerName: winner.name });

  } catch (error: unknown) {
    console.error("Draw Error:", error);
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}