import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPREADSHEET_ID = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

function base64url(input: Uint8Array | string): string {
  let b64: string;
  if (typeof input === 'string') {
    b64 = btoa(input);
  } else {
    b64 = btoa(String.fromCharCode(...input));
  }
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get('GOOGLE_SA_CLIENT_EMAIL');
  const privateKey = Deno.env.get('GOOGLE_SA_PRIVATE_KEY');
  if (!clientEmail || !privateKey) throw new Error('GOOGLE_SA_CLIENT_EMAIL or GOOGLE_SA_PRIVATE_KEY not configured');

  const now = Math.floor(Date.now() / 1000);

  const headerObj = { alg: 'RS256', typ: 'JWT' };
  const payloadObj = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const headerB64 = base64url(JSON.stringify(headerObj));
  const payloadB64 = base64url(JSON.stringify(payloadObj));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key - handle various escape formats
  const pemBody = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .replace(/\s/g, '')
    .trim();
  
  console.log('PEM body length:', pemBody.length);
  
  if (pemBody.length < 100) {
    throw new Error(`Private key appears truncated (${pemBody.length} chars). Please re-enter the full private_key value from your service account JSON file.`);
  }
  
  const binaryKey = Uint8Array.from(atob(pemBody), (c: string) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sigB64 = base64url(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${sigB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Token exchange failed [${tokenRes.status}]: ${err}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!SPREADSHEET_ID) {
    return new Response(JSON.stringify({ error: 'Google Sheets not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const accessToken = await getAccessToken();
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };

    const { action, username, roblox_id, duration, reason, date } = await req.json();

    if (action === 'log_ban') {
      const url = `${SHEETS_BASE}/${SPREADSHEET_ID}/values/Sheet1!A:F:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      const res = await fetch(url, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          values: [[username, roblox_id, duration, reason, date, 'Banned']]
        })
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error('Sheets append error:', errBody);
        throw new Error(`Sheets API error [${res.status}]: ${errBody}`);
      }

      const appendData = await res.json();
      const updatedRange = appendData.updates?.updatedRange;
      if (updatedRange) {
        const rowMatch = updatedRange.match(/(\d+)$/);
        if (rowMatch) {
          const rowIndex = parseInt(rowMatch[1]) - 1;
          await applyStatusFormatting(rowIndex, 'Banned', accessToken);
          await applyDataValidation(rowIndex, accessToken);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'update_unban') {
      const searchUrl = `${SHEETS_BASE}/${SPREADSHEET_ID}/values/Sheet1!B:B`;
      const searchRes = await fetch(searchUrl, { headers: authHeaders });
      if (!searchRes.ok) throw new Error('Failed to search spreadsheet');

      const searchData = await searchRes.json();
      const values = searchData.values || [];

      let targetRow = -1;
      for (let i = values.length - 1; i >= 0; i--) {
        if (values[i]?.[0] === roblox_id) {
          targetRow = i + 1;
          break;
        }
      }

      if (targetRow === -1) {
        return new Response(JSON.stringify({ success: false, error: 'Player not found in sheet' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const updateUrl = `${SHEETS_BASE}/${SPREADSHEET_ID}/values/Sheet1!F${targetRow}?valueInputOption=USER_ENTERED`;
      const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ values: [['Unbanned']] })
      });

      if (!updateRes.ok) {
        const errBody = await updateRes.text();
        throw new Error(`Sheets update error [${updateRes.status}]: ${errBody}`);
      }

      await applyStatusFormatting(targetRow - 1, 'Unbanned', accessToken);

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

async function applyStatusFormatting(rowIndex: number, status: string, accessToken: string) {
  const color = status === 'Banned'
    ? { red: 1, green: 0, blue: 0 }
    : { red: 0, green: 0.4, blue: 0 };
  const textColor = { red: 1, green: 1, blue: 1 };

  const batchUrl = `${SHEETS_BASE}/${SPREADSHEET_ID}:batchUpdate`;
  await fetch(batchUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({
      requests: [{
        repeatCell: {
          range: { sheetId: 0, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 5, endColumnIndex: 6 },
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

async function applyDataValidation(rowIndex: number, accessToken: string) {
  const batchUrl = `${SHEETS_BASE}/${SPREADSHEET_ID}:batchUpdate`;
  await fetch(batchUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({
      requests: [{
        setDataValidation: {
          range: { sheetId: 0, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 5, endColumnIndex: 6 },
          rule: {
            condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'Banned' }, { userEnteredValue: 'Unbanned' }] },
            showCustomUi: true,
            strict: true
          }
        }
      }]
    })
  });
}
