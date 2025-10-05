import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  templateId?: string;
  from?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const { to, subject, html, templateId, from }: SendEmailRequest = await req.json();

    if (!to || !subject || !html) {
      return json({ error: "Missing required fields: to, subject, html" }, 400);
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const DEFAULT_FROM = Deno.env.get("FROM_EMAIL") || "PNG Green Fees <no-reply@pnggreenfees.gov.pg>";
    const fromAddress = from || DEFAULT_FROM;

    if (!RESEND_API_KEY) {
      // No provider configured; fail gracefully with clear message
      return json({
        error: "Email provider not configured",
        hint: "Set RESEND_API_KEY (and optionally FROM_EMAIL) in Edge Function env to enable sending.",
      }, 501);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to,
        subject,
        html,
        tags: templateId ? [{ name: "templateId", value: templateId }] : undefined,
      }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      return json({ error: "Email provider returned an error", details: payload }, 502);
    }

    return json({ success: true, id: payload?.id, provider: "resend" });
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});
