import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

interface SendQuotationRequest {
  quotationId: string | number;
  email: string;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const { quotationId, email }: SendQuotationRequest = await req.json();
    if (!quotationId || !email) return json({ error: 'quotationId and email are required' }, 400);

    // TODO: Fetch quotation from DB, render PDF, attach and send via provider (reuse send-email function or provider here)
    // For now, simulate a success to unblock UI wiring.

    return json({ success: true, quotationId });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});


