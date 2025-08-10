export const runtime = "nodejs"

export async function GET() {
  return new Response(JSON.stringify({ ok: true, service: "extractor", ts: new Date().toISOString() }), {
    headers: { "content-type": "application/json" },
  })
}
