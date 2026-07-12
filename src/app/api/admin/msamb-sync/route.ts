// =============================================================================
// MSAMB Auto-Sync API Route
// POST /api/admin/msamb-sync
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Browser, Page } from 'puppeteer';
import { MSAMB_COMMODITY_MAP } from '@/lib/msamb-commodity-map';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const LOGIN_URL      = 'https://data.msamb.com/';
const DATA_ENTRY_URL = 'https://data.msamb.com/DailyDe.aspx';

const LOGIN_USERNAME_ID = 'ContentPlaceHolder1_UserName';
const LOGIN_PASSWORD_ID = 'ContentPlaceHolder1_Password';
const LOGIN_BTN_ID      = 'ContentPlaceHolder1_cmd_login';

export interface RateSyncItem {
  commodity_name_mr: string;
  variety?: string;
  date: string;       // DD/MM/YYYY
  min_price: number;
  max_price: number;
  modal_price: number;
  min_arrivals: number;
  max_arrivals: number;
  modal_arrivals: number;
}

export interface SyncResult {
  commodity: string;
  success: boolean;
  error?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Discovers all visible form fields by reading the label in the preceding <TD>.
 * Returns { "label text" -> "element ID" }.
 */
async function discoverFormFields(page: Page): Promise<Record<string, string>> {
  return page.evaluate((): Record<string, string> => {
    const map: Record<string, string> = {};
    document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]), select'
    ).forEach((el) => {
      const id = (el as HTMLElement).id;
      if (!id) return;
      let td: Element | null = el.parentElement;
      while (td && td.tagName !== 'TD') td = td.parentElement;
      if (!td) return;
      const prev = td.previousElementSibling;
      if (prev) {
        const label = prev.textContent?.trim().replace(/\s+/g, ' ') || '';
        if (label && label.length < 120) map[label] = id;
      }
    });
    return map;
  });
}

function findField(
  map: Record<string, string>,
  mustInclude: string,
  mustExclude?: string
): string | undefined {
  for (const [label, id] of Object.entries(map)) {
    if (label.includes(mustInclude) && !(mustExclude && label.includes(mustExclude))) {
      return id;
    }
  }
  return undefined;
}

/**
 * Selects a dropdown option by visible text and fires the 'change' event.
 *
 * ⚠️  This dispatches 'change' which may trigger ASP.NET AutoPostBack.
 *     Always call:
 *       const nav = page.waitForNavigation(...).catch(() => null);
 *       await selectDropdownByText(...);
 *       await nav;
 *     so the navigation promise is registered BEFORE the action fires.
 */
async function selectDropdownByText(page: Page, id: string, text: string): Promise<boolean> {
  return page.evaluate(
    (elId: string, searchText: string): boolean => {
      const sel = document.getElementById(elId) as HTMLSelectElement | null;
      if (!sel) return false;
      const opts = Array.from(sel.options);
      const match =
        opts.find((o) => o.text.trim() === searchText.trim()) ??
        opts.find((o) => o.text.trim().includes(searchText.trim())) ??
        opts.find((o) => searchText.trim().includes(o.text.trim()) && o.text.trim().length > 1);
      if (!match) return false;
      sel.value = match.value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    id,
    text
  );
}

async function clearAndType(page: Page, id: string, value: string): Promise<void> {
  const sel = `[id="${id}"]`;
  await page.focus(sel);
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.keyboard.press('Delete');
  await page.type(sel, value, { delay: 30 });
}

async function waitForOptions(page: Page, id: string, ms = 6000): Promise<void> {
  await page
    .waitForFunction(
      (elId: string) => {
        const el = document.getElementById(elId) as HTMLSelectElement | null;
        return el != null && el.options.length > 1;
      },
      { timeout: ms },
      id
    )
    .catch(() => null);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Waits for a PostBack-triggered navigation to fully complete.
 * Uses networkidle2 so we don't proceed while AJAX is still in flight.
 *
 * ⚠️  This promise MUST be created BEFORE the action that triggers navigation.
 */
function waitForPostBack(page: Page, timeoutMs = 15_000) {
  return page
    .waitForNavigation({ waitUntil: 'networkidle2', timeout: timeoutMs })
    .catch(() => null); // null = no navigation (AJAX-only form — fine to continue)
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(req: NextRequest) {
  let rates: RateSyncItem[];
  try {
    rates = (await req.json()).rates;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(rates) || rates.length === 0) {
    return NextResponse.json({ error: 'No rates provided' }, { status: 400 });
  }

  const username = process.env.MSAMB_USERNAME;
  const password = process.env.MSAMB_PASSWORD;
  if (!username || !password) {
    return NextResponse.json(
      { error: 'MSAMB_USERNAME / MSAMB_PASSWORD not set in .env.local' },
      { status: 500 }
    );
  }

  const results: SyncResult[] = [];
  let browser: Browser | undefined;

  try {
    // If a remote Puppeteer WS endpoint is provided (e.g. Browserless.io for Vercel Serverless),
    // connect to it. Otherwise, launch a local headless Chrome.
    const wsEndpoint = process.env.PUPPETEER_WS_ENDPOINT;
    if (wsEndpoint) {
      console.log(`Connecting to remote browser at ${wsEndpoint}...`);
      browser = await puppeteer.connect({
        browserWSEndpoint: wsEndpoint,
      });
    } else {
      console.log("Launching local Chrome browser...");
      // ⚠️  DO NOT use --single-process or --no-zygote:
      //     they cause Chrome to crash mid-session → "Target closed" error.
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
        ],
      });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // ── Login ─────────────────────────────────────────────────────────────────
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30_000 });

    await page.type(`#${LOGIN_USERNAME_ID}`, username);
    await page.type(`#${LOGIN_PASSWORD_ID}`, password);

    // Start listening for the post-login redirect BEFORE clicking
    const loginNav = waitForPostBack(page, 20_000);
    await page.click(`#${LOGIN_BTN_ID}`);
    await loginNav;

    if (page.url() === LOGIN_URL || page.url().endsWith('/')) {
      throw new Error('Login failed — check MSAMB credentials in .env.local');
    }

    // ── Process each rate ─────────────────────────────────────────────────────
    for (const rate of rates) {
      const msambEntry = MSAMB_COMMODITY_MAP[rate.commodity_name_mr];

      if (!msambEntry) {
        results.push({
          commodity: rate.commodity_name_mr,
          success: false,
          error: `MSAMB mapping not configured for: ${rate.commodity_name_mr}`,
        });
        continue;
      }

      try {
        // Navigate fresh to the data entry form for every commodity
        await page.goto(DATA_ENTRY_URL, { waitUntil: 'networkidle2', timeout: 20_000 });

        let fields = await discoverFormFields(page);

        // ─ Date ───────────────────────────────────────────────────────────────
        const dateId = findField(fields, 'दिनांक');
        if (dateId) {
          await clearAndType(page, dateId, rate.date);
          // Date field does NOT trigger PostBack — safe direct dispatch
          await page.evaluate((id: string) => {
            const el = document.getElementById(id) as HTMLInputElement | null;
            el?.dispatchEvent(new Event('change', { bubbles: true }));
          }, dateId);
          await sleep(300);
        }

        // ─ Commodity dropdown ─────────────────────────────────────────────────
        //   AutoPostBack fires on change → full page reload.
        //   Register nav promise BEFORE the action to avoid "Target closed".
        const commodityId = findField(fields, 'शेतमालाचे नाव');
        if (!commodityId) throw new Error('Commodity dropdown not found');

        const navCommodity = waitForPostBack(page);            // ← BEFORE
        const commodityOk  = await selectDropdownByText(page, commodityId, msambEntry.name);
        if (!commodityOk) throw new Error(`Commodity "${msambEntry.name}" not found in dropdown`);
        await navCommodity;                                    // ← AFTER (waits for networkidle2)

        // Re-discover — DOM is completely fresh after PostBack
        fields = await discoverFormFields(page);

        // ─ Variety dropdown ───────────────────────────────────────────────────
        const varietyId = findField(fields, 'जात') ?? findField(fields, 'प्रत');
        if (!varietyId) throw new Error('Variety dropdown not found');

        await waitForOptions(page, varietyId);

        const varietyToSelect = rate.variety || msambEntry.variety;
        const varietyOk = await selectDropdownByText(page, varietyId, varietyToSelect);
        if (!varietyOk) throw new Error(`Variety "${varietyToSelect}" not found in dropdown`);
        await sleep(300);

        // ─ Unit ───────────────────────────────────────────────────────────────
        const unitId = findField(fields, 'परिमाण');
        if (unitId) {
          await selectDropdownByText(page, unitId, 'क्विंटल');
          await sleep(200);
        }

        // ─ FAQ / Non-FAQ (MSP commodities only) ───────────────────────────────
        const liveFields = await discoverFormFields(page);
        const faqId = findField(liveFields, 'FAQ');
        if (faqId) {
          await selectDropdownByText(page, faqId, 'Non FAQ');
          await sleep(200);
        }

        // ─ Prices ─────────────────────────────────────────────────────────────
        const minPriceId   = findField(liveFields, 'किमान दर',      'दराला');
        const maxPriceId   = findField(liveFields, 'कमाल दर',       'दराला');
        const modalPriceId = findField(liveFields, 'सर्वसाधारण दर', 'दराला');

        if (!minPriceId || !maxPriceId || !modalPriceId) {
          throw new Error(
            `Price fields missing: min=${minPriceId}, max=${maxPriceId}, modal=${modalPriceId}. ` +
            `Labels: ${Object.keys(liveFields).join(' | ')}`
          );
        }

        await clearAndType(page, minPriceId,   rate.min_price.toString());
        await clearAndType(page, maxPriceId,   rate.max_price.toString());
        await clearAndType(page, modalPriceId, rate.modal_price.toString());

        // ─ Arrivals ───────────────────────────────────────────────────────────
        const minArrId   = findField(liveFields, 'किमान दराला');
        const maxArrId   = findField(liveFields, 'कमाल दराला');
        const modalArrId = findField(liveFields, 'सर्वसाधारण दराला');

        if (minArrId)   await clearAndType(page, minArrId,   rate.min_arrivals.toString());
        if (maxArrId)   await clearAndType(page, maxArrId,   rate.max_arrivals.toString());
        if (modalArrId) await clearAndType(page, modalArrId, rate.modal_arrivals.toString());

        // ─ Submit ─────────────────────────────────────────────────────────────
        const submitBtn = await page.$('input[type="submit"]');
        if (!submitBtn) throw new Error('Submit button not found');

        const navSubmit = waitForPostBack(page, 20_000);      // ← BEFORE
        await submitBtn.click();
        await navSubmit;                                       // ← AFTER

        // ─ Error check ────────────────────────────────────────────────────────
        const errorText = await page.evaluate((): string => {
          const els = document.querySelectorAll(
            'font[color="red"], font[color="Red"], ' +
            'span[style*="color:red"], span[style*="color: red"], ' +
            '.error, #ContentPlaceHolder1_lblError'
          );
          return Array.from(els)
            .map((el) => el.textContent?.trim() ?? '')
            .filter((t) => t.length > 0 && t.length < 300)
            .join('; ');
        });

        if (errorText && !errorText.includes('आधारभूत किमत')) {
          throw new Error(`MSAMB error after submit: ${errorText}`);
        }

        results.push({ commodity: rate.commodity_name_mr, success: true });

      } catch (err: unknown) {
        results.push({
          commodity: rate.commodity_name_mr,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Logout (best-effort)
    try {
      const out = await page.$('a[href*="ogout"], a[href*="LogOut"]');
      if (out) await out.click();
    } catch { /* ignore */ }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `MSAMB automation failed: ${msg}`, results },
      { status: 500 }
    );
  } finally {
    if (browser) { try { await browser.close(); } catch { /* ignore */ } }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount    = results.filter((r) => !r.success).length;

  return NextResponse.json({ success: failCount === 0, successCount, failCount, results });
}
