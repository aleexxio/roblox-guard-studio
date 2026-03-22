import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');
const SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!API_KEY || !SPREADSHEET_ID) {
    return new Response(JSON.stringify({ error: 'Google Sheets not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { action, username, roblox_id, duration, reason, date } = await req.json();

    if (action === 'log_ban') {
      const url = `${SHEETS_BASE}/${SPREADSHEET_ID}/values/Sheet1!A:F:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS&key=${API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: [[username, roblox_id, duration, reason, date, 'Banned']]
        })
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error('Sheets append error:', errBody);
        throw new Error(`Sheets API error [${res.status}]: ${errBody}`);
      }

      // Apply red background to the status cell of the newly added row
      // First find which row was just added
      const appendData = await res.json();
      const updatedRange = appendData.updates?.updatedRange;
      if (updatedRange) {
        const rowMatch = updatedRange.match(/(\d+)$/);
        if (rowMatch) {
          const rowIndex = parseInt(rowMatch[1]) - 1; // 0-indexed
          await applyStatusFormatting(rowIndex, 'Banned');
          await applyDataValidation(rowIndex);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'update_unban') {
      // Search column B for the roblox_id to find the row
      const searchUrl = `${SHEETS_BASE}/${SPREADSHEET_ID}/values/Sheet1!B:B?key=${API_KEY}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error('Failed to search spreadsheet');

      const searchData = await searchRes.json();
      const values = searchData.values || [];
      
      // Find the LAST matching row with this roblox_id (most recent ban)
      let targetRow = -1;
      for (let i = values.length - 1; i >= 0; i--) {
        if (values[i]?.[0] === roblox_id) {
          targetRow = i + 1; // 1-indexed
          break;
        }
      }

      if (targetRow === -1) {
        return new Response(JSON.stringify({ success: false, error: 'Player not found in sheet' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update column F to "Unbanned"
      const updateUrl = `${SHEETS_BASE}/${SPREADSHEET_ID}/values/Sheet1!F${targetRow}?valueInputOption=USER_ENTERED&key=${API_KEY}`;
      const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [['Unbanned']] })
      });

      if (!updateRes.ok) {
        const errBody = await updateRes.text();
        throw new Error(`Sheets update error [${updateRes.status}]: ${errBody}`);
      }

      // Apply green formatting
      await applyStatusFormatting(targetRow - 1, 'Unbanned');

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Google Sheets log error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function applyStatusFormatting(rowIndex: number, status: string) {
  const color = status === 'Banned'
    ? { red: 1, green: 0, blue: 0 }        // Red
    : { red: 0, green: 0.4, blue: 0 };       // Dark green

  const textColor = { red: 1, green: 1, blue: 1 }; // White text

  const batchUrl = `${SHEETS_BASE}/${SPREADSHEET_ID}:batchUpdate?key=${API_KEY}`;
  await fetch(batchUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
            startColumnIndex: 5, // Column F
            endColumnIndex: 6
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: color,
              textFormat: { foregroundColor: textColor, bold: true },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
        }
      }]
    })
  });
}

async function applyDataValidation(rowIndex: number) {
  const batchUrl = `${SHEETS_BASE}/${SPREADSHEET_ID}:batchUpdate?key=${API_KEY}`;
  await fetch(batchUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        setDataValidation: {
          range: {
            sheetId: 0,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
            startColumnIndex: 5,
            endColumnIndex: 6
          },
          rule: {
            condition: {
              type: 'ONE_OF_LIST',
              values: [
                { userEnteredValue: 'Banned' },
                { userEnteredValue: 'Unbanned' }
              ]
            },
            showCustomUi: true,
            strict: true
          }
        }
      }]
    })
  });
}
