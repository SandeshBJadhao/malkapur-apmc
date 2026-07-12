import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface ReviewedItem {
  id: string;
  commodity_id: string | null;
  commodity_name_raw: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  min_arrivals: number;
  max_arrivals: number;
  modal_arrivals: number;
  unit: string;
  market_center: string;
  admin_action: 'keep' | 'skip';
  variety?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { session_id, items, date_for, market_center } = body as {
      session_id: string;
      items: ReviewedItem[];
      date_for: string;
      market_center: string;
    };

    if (!session_id || !items?.length || !date_for) {
      return NextResponse.json({ error: 'Missing required fields: session_id, items, date_for.' }, { status: 400 });
    }

    // Filter only items admin approved
    const toPublish = items.filter(
      (item) => item.admin_action === 'keep' && item.commodity_id && item.min_price != null
    );

    if (toPublish.length === 0) {
      return NextResponse.json({ error: 'No approved items to publish.' }, { status: 400 });
    }

    // Build and aggregate upsert payloads for market_rates table to prevent ON CONFLICT duplicate key errors
    const uniquePayloadsMap: Record<string, {
      commodity_id: string;
      date: string;
      market_center: string;
      min_price: number;
      max_price: number;
      modal_price: number;
      min_arrivals: number;
      max_arrivals: number;
      modal_arrivals: number;
      unit: string;
      variety: string;
    }> = {};

    for (const item of toPublish) {
      const commId = item.commodity_id!;
      const center = item.market_center || market_center;
      const key = `${commId}_${center}`;

      const minVal = Number(item.min_price);
      const maxVal = Number(item.max_price);
      const modalVal = Number(item.modal_price);
      const minArr = Number(item.min_arrivals) || 0;
      const maxArr = Number(item.max_arrivals) || 0;
      const modalArr = Number(item.modal_arrivals) || 0;
      const itemVariety = item.variety || '';

      if (!uniquePayloadsMap[key]) {
        uniquePayloadsMap[key] = {
          commodity_id: commId,
          date: date_for,
          market_center: center,
          min_price: minVal,
          max_price: maxVal,
          modal_price: modalVal,
          min_arrivals: minArr,
          max_arrivals: maxArr,
          modal_arrivals: modalArr,
          unit: item.unit || 'क्विंटल',
          variety: itemVariety,
        };
      } else {
        const existing = uniquePayloadsMap[key];
        existing.min_price = Math.min(existing.min_price, minVal);
        existing.max_price = Math.max(existing.max_price, maxVal);
        // Average the modal price
        existing.modal_price = Math.round((existing.modal_price + modalVal) / 2);
        existing.min_arrivals += minArr;
        existing.max_arrivals += maxArr;
        existing.modal_arrivals += modalArr;
        if (!existing.variety && itemVariety) {
          existing.variety = itemVariety;
        }
      }
    }

    const upsertPayloads = Object.values(uniquePayloadsMap);

    // Upsert into market_rates — ON CONFLICT (commodity_id, date, market_center) DO UPDATE
    const { data: upserted, error: upsertError } = await supabase
      .from('market_rates')
      .upsert(upsertPayloads, {
        onConflict: 'commodity_id,date,market_center',
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // Mark session as published
    await supabase
      .from('rate_import_sessions')
      .update({ status: 'published' })
      .eq('id', session_id);

    return NextResponse.json({
      published_count: upserted?.length || toPublish.length,
      message: `Successfully published ${toPublish.length} commodity rates for ${date_for}.`,
    });
  } catch (err: unknown) {
    console.error('Publish error:', err);
    const message = err instanceof Error ? err.message : 'Unexpected server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
