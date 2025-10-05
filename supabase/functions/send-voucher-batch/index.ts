import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

interface SendBatchRequest {
  batchId: string | number;
  email: string;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const { batchId, email }: SendBatchRequest = await req.json();
    if (!batchId || !email) return json({ error: 'batchId and email are required' }, 400);

    // TODO: Generate PDFs in batches, ZIP, email
    return json({ success: true, batchId });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});


