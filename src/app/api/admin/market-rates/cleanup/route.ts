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

    // 2. Fetch all rates sorted by commodity, market center, and date descending
    const { data: rates, error: fetchError } = await supabaseAdmin
      .from('market_rates')
      .select('id, commodity_id, market_center, date')
      .order('commodity_id', { ascending: true })
      .order('market_center', { ascending: true })
      .order('date', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch market rates: ${fetchError.message}`);
    }

    if (!rates || rates.length === 0) {
      return NextResponse.json({ success: true, deletedCount: 0 });
    }

    // 3. Identify duplicate (older) records for each commodity + market center
    const seen = new Set<string>();
    const idsToDelete: string[] = [];

    for (const rate of rates) {
      const key = `${rate.commodity_id}|${rate.market_center || 'malkapur_main'}`;
      if (seen.has(key)) {
        // We've already seen the latest rate for this commodity + market center combination.
        // Since the list is sorted by date descending, this rate is older history.
        idsToDelete.push(rate.id);
      } else {
        seen.add(key);
      }
    }

    // 4. Delete the older records
    let deletedCount = 0;
    if (idsToDelete.length > 0) {
      // Supabase supports .in() for multiple IDs
      const { error: deleteError } = await supabaseAdmin
        .from('market_rates')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        throw new Error(`Failed to delete older market rates: ${deleteError.message}`);
      }
      deletedCount = idsToDelete.length;
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} older records cleaned up successfully.`
    });

  } catch (error: any) {
    console.error('Error in cleanup route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
