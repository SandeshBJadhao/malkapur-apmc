// =============================================================================
// MSAMB Commodity Mapping
// Maps your website's commodity name_mr → MSAMB portal dropdown values
//
// MSAMB dropdown at: https://data.msamb.com/DailyDe.aspx
//   - शेतमालाचे नाव  → commodity name (exact text in MSAMB dropdown)
//   - शेतमालाची जात / प्रत → variety (exact text in variety dropdown)
//
// NOTE: MSAMB spellings may differ slightly from your DB (e.g. सोयाबीन vs सोयाबिन)
// =============================================================================

export interface MSAMBCommodityEntry {
  /** Exact text shown in the MSAMB शेतमालाचे नाव dropdown */
  name: string;
  /** Exact text shown in the MSAMB शेतमालाची जात / प्रत dropdown */
  variety: string;
}

/**
 * Map from your Supabase DB commodity name_mr → MSAMB dropdown values.
 *
 * KEY   = name_mr stored in your website's `commodities` table
 * VALUE = { name, variety } that MSAMB portal uses in its dropdowns
 */
export const MSAMB_COMMODITY_MAP: Record<string, MSAMBCommodityEntry> = {
  // ── Commodities ────────────────────────────────────────
  'सोयाबीन':          { name: 'सोयाबिन',             variety: 'पिवळा'    },
  'कापूस (कपाशी)':    { name: 'कापूस',               variety: 'लोकल'     },
  'मका':              { name: 'मका',                  variety: 'पिवळी'    },
  'गहू':              { name: 'गहू',                  variety: 'लोकल'     },
  'तूर (अरहर)':       { name: 'तूर',                  variety: 'लाल'      },
  'हरभरा (चना)':      { name: 'हरभरा',               variety: 'चाफा'     },
  'मूग':              { name: 'मूग',                  variety: 'चमकी'     },
  'उडीद':             { name: 'उडीद',                 variety: 'काळा'     },
  'कांदा':            { name: 'कांदा',               variety: 'लोकल'     },
  'ज्वारी':           { name: 'ज्वारी',              variety: 'हायब्रीड' },
  'तील':              { name: 'तील',                 variety: 'लोकल'     },
  'बटबटी':            { name: 'बटबटी',               variety: 'लोकल'     },
  'बाजरी':            { name: 'बाजरी',               variety: 'लोकल'     },
  'भुईमुग शेंग (सुकी)': { name: 'भुईमुग शेंग (सुकी)', variety: 'लोकल'     },
  'मिरची (लाल)':      { name: 'मिरची (लाल)',          variety: 'लोकल'     },
  'मोहरी':            { name: 'मोहरी',               variety: 'लोकल'     },
};
