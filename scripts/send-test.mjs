// Simulate a Twilio WhatsApp inbound webhook to your local n8n
// Usage: node scripts/send-test.mjs "LIST /ProjectX" "whatsapp:+1234567890"
import fetch from "node-fetch"
const [, , body = "HELP", from = "whatsapp:+10000000000"] = process.argv

const webhook = process.env.N8N_WEBHOOK_URL
  ? `${process.env.N8N_WEBHOOK_URL.replace(/\/$/, "")}/webhook/whatsapp`
  : "http://localhost:5678/webhook/whatsapp"

const params = new URLSearchParams()
params.set("From", from)
params.set("Body", body)

const res = await fetch(webhook, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: params.toString(),
})
console.log("Status:", res.status)
try {
  console.log("Response:", await res.text())
} catch (e) {
  console.log("No response body.")
}
