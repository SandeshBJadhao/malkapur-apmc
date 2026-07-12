import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user to verify they are an admin
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = await createAdminClient();

    // 2. Fetch all commodities from the database to map names
    const { data: dbCommodities, error: dbError } = await supabaseAdmin
      .from('commodities')
      .select('id, name_mr, name_en, unit');

    if (dbError) {
      throw new Error(`Failed to fetch database commodities: ${dbError.message}`);
    }

    // Create a map of lowercase, trimmed Marathi name to commodity record
    const commodityMap = new Map<string, typeof dbCommodities[0]>();
    dbCommodities.forEach(c => {
      const key = c.name_mr.trim().toLowerCase();
      commodityMap.set(key, c);
    });

    // 3. Fetch APMC list from MSAMB to find Malkapur's code
    console.log("Fetching MSAMB APMC list...");
    let apmcCode = '083'; // default fallback for Malkapur
    try {
      const apmcRes = await fetch('https://msamb.com/ApmcDetail/GetApmcForArrivalPriceInfo', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://msamb.com/ApmcDetail/APMCPriceInformation'
        },
        next: { revalidate: 3600 } // cache for 1 hour
      });
      if (apmcRes.ok) {
        const apmcList = await apmcRes.json();
        const malkapur = apmcList.find((a: any) => 
          a.ApmcNameE?.toLowerCase().includes('malkapur') ||
          a.ApmcNameM?.includes('मलकापूर')
        );
        if (malkapur && malkapur.ApmcCode) {
          apmcCode = malkapur.ApmcCode;
          console.log(`Found Malkapur APMC code dynamically: ${apmcCode}`);
        }
      }
    } catch (apmcErr) {
      console.warn("Failed to fetch APMC list dynamically, falling back to 083:", apmcErr);
    }

    // 4. Fetch the data grid for Malkapur
    console.log(`Fetching rates from MSAMB for APMC code ${apmcCode}...`);
    const dataUrl = `https://msamb.com/ApmcDetail/DataGridBind?commodityCode=null&apmcCode=${apmcCode}`;
    const dataRes = await fetch(dataUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://msamb.com/ApmcDetail/APMCPriceInformation'
      }
    });

    if (!dataRes.ok) {
      throw new Error(`MSAMB responded with status ${dataRes.status}`);
    }

    const html = await dataRes.text();
    if (!html || html.length < 10) {
      return NextResponse.json({ success: false, error: 'MSAMB returned empty data.' }, { status: 500 });
    }

    // 5. Parse the HTML using regex
    const trRegex = /<tr>([\s\S]*?)<\/tr>/gi;
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const dateRegex = /(\d{2})\/(\d{2})\/(\d{4})/;

    let match;
    let currentDate = null;
    const parsedRecords = [];

    while ((match = trRegex.exec(html)) !== null) {
      const trContent = match[1];
      const tds = [];
      let tdMatch;
      
      while ((tdMatch = tdRegex.exec(trContent)) !== null) {
        tds.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
      }

      if (tds.length === 0) continue;

      // Check if it's a date row
      const dateMatch = tds[0].match(dateRegex);
      if (dateMatch) {
        currentDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
        continue;
      }

      // Check if it's a commodity data row (should have 7 columns)
      if (tds.length === 7 && currentDate) {
        parsedRecords.push({
          date: currentDate,
          commodityName: tds[0],
          variety: tds[1],
          unit: tds[2],
          arrivals: parseFloat(tds[3]) || 0,
          minPrice: parseFloat(tds[4]) || 0,
          maxPrice: parseFloat(tds[5]) || 0,
          modalPrice: parseFloat(tds[6]) || 0
        });
      }
    }

    if (parsedRecords.length === 0) {
      return NextResponse.json({ success: true, message: 'No records found on MSAMB.', syncedCount: 0, unmatched: [] });
    }

    // 6. Match and prepare database records
    const ratesToUpsert: any[] = [];
    const unmatchedCommodities = new Set<string>();

    for (const record of parsedRecords) {
      const normalizedName = record.commodityName.trim().toLowerCase();
      const matched = commodityMap.get(normalizedName);

      if (matched) {
        ratesToUpsert.push({
          commodity_id: matched.id,
          date: record.date,
          market_center: 'malkapur_main',
          min_price: record.minPrice,
          max_price: record.maxPrice,
          modal_price: record.modalPrice,
          min_arrivals: 0,
          max_arrivals: 0,
          modal_arrivals: record.arrivals,
          unit: record.unit || matched.unit || 'क्विंटल',
          variety: record.variety || 'लोकल'
        });
      } else {
        unmatchedCommodities.add(record.commodityName);
      }
    }

    // 7. Upsert to Supabase database
    let syncedCount = 0;
    if (ratesToUpsert.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('market_rates')
        .upsert(ratesToUpsert, {
          onConflict: 'commodity_id,date,market_center'
        });

      if (upsertError) {
        throw new Error(`Failed to upsert market rates to database: ${upsertError.message}`);
      }
      syncedCount = ratesToUpsert.length;
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      unmatched: Array.from(unmatchedCommodities),
      recordsCount: parsedRecords.length
    });

  } catch (err: any) {
    console.error("MSAMB Fetch API Error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || 'An unexpected error occurred.'
    }, { status: 500 });
  }
}
