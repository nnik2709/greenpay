import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

interface SendBulkRequest {
  passportIds: (string | number)[];
  email: string;
  message?: string;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const { passportIds, email, message }: SendBulkRequest = await req.json();
    if (!email || !Array.isArray(passportIds) || passportIds.length === 0) {
      return json({ error: 'email and non-empty passportIds[] required' }, 400);
    }

    // TODO: Generate PDFs in batches of 10, ZIP, email via provider
    return json({ success: true, count: passportIds.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});


