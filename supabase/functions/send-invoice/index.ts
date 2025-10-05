import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

interface SendInvoiceRequest {
  invoiceId: string | number;
  email: string;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const { invoiceId, email }: SendInvoiceRequest = await req.json();
    if (!invoiceId || !email) return json({ error: 'invoiceId and email are required' }, 400);

    // TODO: Fetch invoice, render PDF, email via provider
    return json({ success: true, invoiceId });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});


