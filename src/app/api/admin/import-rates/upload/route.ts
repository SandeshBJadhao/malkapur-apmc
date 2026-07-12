import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase admin client ─────────────────────────────────────────────────────
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Devanagari numeral converter ─────────────────────────────────────────────
function devanagariToArabic(text: string): string {
  const map: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return text.replace(/[०-९]/g, (d) => map[d] || d);
}

// ─── Commodity name fuzzy matcher ─────────────────────────────────────────────
const COMMODITY_ALIASES: Record<string, string[]> = {
  'गहू':            ['गहु', 'गहू', 'गव्हू', 'गव्हु'],
  'जवारी':          ['जवरी', 'जवारी', 'जोंधळा', 'ज्वारी'],
  'मका':            ['मका', 'मक्का', 'मकई'],
  'तूर (अरहर)':    ['तूर', 'तुर', 'अरहर', 'तुरी'],
  'हरभरा (चना)':   ['चना', 'चणा', 'हरभरा', 'हरभ्रा', 'चने'],
  'मूग':            ['मूग', 'मुग', 'मुगडाळ'],
  'उडीद':           ['उडीद', 'उडद', 'मटकी'],
  'सोयाबीन':        ['सोयाबीन', 'सोयाबिन', 'सोयाबन'],
  'कापूस (कपाशी)': ['कापूस', 'कापुस', 'कपाशी', 'कपास'],
  'तीळ':            ['तीळ', 'तिळ', 'तिल', 'तील'],
  'चवळी':           ['चवळी', 'चवली', 'चवळ्या'],
};

function matchCommodityName(
  rawName: string,
  dbCommodities: { id: string; name_mr: string; name_en: string }[]
): { commodity_id: string | null; confidence: number } {
  if (!rawName) return { commodity_id: null, confidence: 30 };
  const clean = rawName.trim();

  // 1. Exact or contains match against DB name_mr
  const exactMatch = dbCommodities.find(
    (c) => c.name_mr.trim() === clean || c.name_mr.includes(clean) || clean.includes(c.name_mr.split(' ')[0])
  );
  if (exactMatch) return { commodity_id: exactMatch.id, confidence: 95 };

  // 2. Alias matching
  for (const [canonicalMr, aliases] of Object.entries(COMMODITY_ALIASES)) {
    if (aliases.some((alias) => alias === clean || clean.includes(alias) || alias.includes(clean))) {
      const dbMatch = dbCommodities.find(
        (c) =>
          c.name_mr.includes(canonicalMr.split(' ')[0]) ||
          canonicalMr.includes(c.name_mr.split(' ')[0])
      );
      if (dbMatch) return { commodity_id: dbMatch.id, confidence: 80 };
    }
  }

  // 3. First character partial match
  const partialMatch = dbCommodities.find(
    (c) => c.name_mr.charAt(0) === clean.charAt(0)
  );
  if (partialMatch) return { commodity_id: partialMatch.id, confidence: 55 };

  return { commodity_id: null, confidence: 35 };
}

// ─── Gemini Extraction Prompt ─────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are analyzing a handwritten Marathi agricultural market register called "सौदा रजिस्टर" from Malkapur APMC (मलकापूर कृषी उत्पन्न बाजार समिती).

TASK: Extract commodity transaction data from this image.

STEP 1 - Find the date:
Look for text after "सौदा रजिस्टर" in the page header.
Format will be like "22-6-2026" or "28-8-2026". Convert to ISO format YYYY-MM-DD.
If the date is unclear, use null.

STEP 2 - Extract each transaction row from the table:
The table has many columns. Focus ONLY on these 3:
  Column 2: मालधन्याचे नांव — the commodity/crop name written in Marathi Devanagari script
  Column 7: आवक — the arrivals quantity (a number, usually in the "परिणाम" section)
  Column 8 or 9: भाव क्विंटल — the rate/price per quintal in rupees

IMPORTANT RULES:
- Convert all Devanagari numerals (०,१,२,३,४,५,६,७,८,९) to standard Arabic digits (0,1,2,3,4,5,6,7,8,9)
- If the same commodity appears in multiple rows, list EACH row separately
- Skip empty rows, header rows, footer rows, signature rows, date rows
- If a numeric value is unreadable or missing, use null instead of guessing
- Do NOT include broker names, buyer names, or any other columns

RETURN FORMAT: Return ONLY valid JSON — no markdown, no code blocks, just raw JSON:
{
  "date": "2026-06-22",
  "transactions": [
    { "commodity_mr": "गहू", "arrivals": 40, "rate": 2280 },
    { "commodity_mr": "गहू", "arrivals": 25, "rate": 2310 },
    { "commodity_mr": "जवारी", "arrivals": 30, "rate": 2200 }
  ]
}`;

// ─── Direct Gemini REST API call ──────────────────────────────────────────────
// Uses direct fetch instead of SDK to support all key formats (AIza, AQ., etc.)
async function callGeminiAPI(base64Image: string, mimeType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured in .env.local');

  const MODEL = 'gemini-2.5-flash';
  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

  const requestBody = {
    contents: [
      {
        parts: [
          { text: EXTRACTION_PROMPT },
          { inline_data: { mime_type: mimeType, data: base64Image } },
        ],
      },
    ],
  };

  // ── Attempt 1: API key as URL query parameter (standard for AIza keys) ──────
  const urlWithKey = `${BASE_URL}/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  let response = await fetch(urlWithKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  // ── Attempt 2: x-goog-api-key header ────────────────────────────────────────
  if (!response.ok && response.status === 401) {
    response = await fetch(`${BASE_URL}/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });
  }

  // ── Attempt 3: Authorization Bearer (for OAuth-type AQ. tokens) ─────────────
  if (!response.ok && response.status === 401) {
    response = await fetch(`${BASE_URL}/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || response.statusText;
    const statusCode = response.status;

    // Provide helpful error messages based on status code
    if (statusCode === 401) {
      throw new Error(
        `Gemini API authentication failed (401). Your API key appears to be an OAuth access token (AQ. format) which is short-lived and not suitable for server-side use. ` +
        `Please generate a proper API key from https://aistudio.google.com/apikey — it should start with "AIza".`
      );
    }
    if (statusCode === 429) {
      throw new Error('Gemini API rate limit reached. Please wait a moment and try again.');
    }
    if (statusCode === 400) {
      throw new Error(`Gemini API bad request (${errMsg}). The image may be too large or in an unsupported format.`);
    }
    throw new Error(`Gemini API error (${statusCode}): ${errMsg}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response. Please try again with a clearer image.');
  return text;
}

// ─── Group transactions by commodity → compute min/max/modal/total ────────────
interface Transaction {
  commodity_mr: string;
  arrivals: number | null;
  rate: number | null;
}

interface AggregatedRate {
  commodity_name_raw: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrivals_qty: number;
}

function aggregateTransactions(transactions: Transaction[]): AggregatedRate[] {
  const grouped: Record<string, { rates: number[]; arrivals: number }> = {};

  for (const tx of transactions) {
    if (!tx.commodity_mr || tx.rate === null || tx.rate === undefined) continue;
    const key = tx.commodity_mr.trim();
    if (!grouped[key]) grouped[key] = { rates: [], arrivals: 0 };
    grouped[key].rates.push(Number(tx.rate));
    grouped[key].arrivals += Number(tx.arrivals) || 0;
  }

  return Object.entries(grouped).map(([name, { rates, arrivals }]) => ({
    commodity_name_raw: name,
    min_price: Math.min(...rates),
    max_price: Math.max(...rates),
    modal_price: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
    arrivals_qty: arrivals,
  }));
}

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Parse multipart form data
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const marketCenter = (formData.get('market_center') as string) || 'malkapur_main';
    const dateOverride = formData.get('date_for') as string | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    // 2. Convert image to buffer and base64
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    // 3. Upload image to Supabase Storage (audit record)
    const timestamp = Date.now();
    const safeFileName = imageFile.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const storagePath = `${timestamp}-${safeFileName}`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === 'rate-images')) {
      await supabase.storage.createBucket('rate-images', { public: false });
    }

    await supabase.storage
      .from('rate-images')
      .upload(storagePath, imageBuffer, { contentType: mimeType, upsert: false });

    const { data: urlData } = supabase.storage.from('rate-images').getPublicUrl(storagePath);
    const imageUrl = urlData?.publicUrl || null;

    // 4. Call Gemini API via direct REST fetch
    const rawText = await callGeminiAPI(base64Image, mimeType);

    // 5. Parse Gemini JSON response — robustly handle any extra text Gemini adds
    let aiJson: { date?: string; transactions?: Transaction[] } = {};
    try {
      // Step 1: Convert any Devanagari numerals to Arabic
      const converted = devanagariToArabic(rawText);

      // Step 2: Try to find a JSON object anywhere in the response
      // This handles: markdown code fences, preamble text, trailing text, etc.
      const jsonMatch = converted.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON object found in Gemini response:', rawText.slice(0, 500));
        return NextResponse.json(
          { error: 'Gemini AI could not extract structured data from this image. Please try again — if this persists, the image may need better lighting or angle.' },
          { status: 422 }
        );
      }

      // Step 3: Parse the extracted JSON
      aiJson = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('JSON parse error. Raw Gemini response:', rawText.slice(0, 500));
      return NextResponse.json(
        { error: 'AI returned data in an unexpected format. Please try submitting the image again.' },
        { status: 422 }
      );
    }


    const transactions: Transaction[] = aiJson.transactions || [];
    const extractedDate = dateOverride || aiJson.date || new Date().toISOString().split('T')[0];

    // 6. Aggregate by commodity
    const aggregated = aggregateTransactions(transactions);
    if (aggregated.length === 0) {
      return NextResponse.json(
        { error: 'No commodity rates could be extracted. Please ensure the photo is clear and shows the rate table.' },
        { status: 422 }
      );
    }

    // 7. Fetch existing commodities for matching
    const { data: dbCommodities } = await supabase
      .from('commodities')
      .select('id, name_mr, name_en')
      .eq('is_active', true);

    // 8. Create import session in Supabase
    const { data: session, error: sessionError } = await supabase
      .from('rate_import_sessions')
      .insert({
        image_url: imageUrl,
        status: 'pending',
        date_for: extractedDate,
        market_center: marketCenter,
        raw_ai_json: aiJson,
      })
      .select()
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Failed to create import session in database.' }, { status: 500 });
    }

    // 9. Build import items with confidence scoring
    const items = aggregated.map((agg) => {
      const { commodity_id, confidence } = matchCommodityName(agg.commodity_name_raw, dbCommodities || []);
      return {
        session_id: session.id,
        commodity_id,
        commodity_name_raw: agg.commodity_name_raw,
        min_price: agg.min_price,
        max_price: agg.max_price,
        modal_price: agg.modal_price,
        arrivals_qty: agg.arrivals_qty,
        unit: 'क्विंटल',
        market_center: marketCenter,
        confidence,
        is_flagged: confidence < 70,
        admin_action: 'keep',
      };
    });

    const { data: insertedItems, error: itemsError } = await supabase
      .from('rate_import_items')
      .insert(items)
      .select();

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to save extracted items to database.' }, { status: 500 });
    }

    // 10. Return session + items enriched with commodity info
    const itemsWithCommodity = (insertedItems || []).map((item) => ({
      ...item,
      commodity: (dbCommodities || []).find((c) => c.id === item.commodity_id) || null,
    }));

    return NextResponse.json({
      session,
      items: itemsWithCommodity,
      commodities: dbCommodities || [],
      extracted_date: extractedDate,
      transaction_count: transactions.length,
    });
  } catch (err: unknown) {
    console.error('Import upload error:', err);
    const message = err instanceof Error ? err.message : 'Unexpected server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
