import type { NextRequest } from "next/server"
import mammoth from "mammoth"
import pdfParse from "pdf-parse"

function arrBufToBuf(ab: ArrayBuffer) {
  return Buffer.from(new Uint8Array(ab))
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  const res = await pdfParse(buffer)
  return res.text || ""
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer })
  return value || ""
}

async function extractFromText(buffer: Buffer, contentType?: string): Promise<string> {
  // Default to UTF-8
  return buffer.toString("utf-8")
}

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || ""
    const maxBytes = 20 * 1024 * 1024 // 20MB
    let mime = ""
    let buffer: Buffer | null = null

    if (contentType.startsWith("multipart/form-data")) {
      const form = await req.formData()
      const file = form.get("file") as unknown as File | null
      if (!file) {
        return new Response(JSON.stringify({ error: "Missing file" }), { status: 400 })
      }
      mime = file.type || (form.get("mimeType") as string) || ""
      const arr = await file.arrayBuffer()
      if (arr.byteLength > maxBytes) return new Response(JSON.stringify({ error: "File too large" }), { status: 413 })
      buffer = arrBufToBuf(arr)
    } else {
      const arr = await req.arrayBuffer()
      if (arr.byteLength > maxBytes) return new Response(JSON.stringify({ error: "File too large" }), { status: 413 })
      buffer = arrBufToBuf(arr)
      mime = req.headers.get("x-mime-type") || ""
    }

    if (!buffer) return new Response(JSON.stringify({ error: "No data" }), { status: 400 })

    let text = ""
    const mt = mime.toLowerCase()

    if (mt.includes("pdf")) {
      text = await extractFromPdf(buffer)
    } else if (mt.includes("wordprocessingml") || mt.includes("msword") || mt.includes("docx")) {
      text = await extractFromDocx(buffer)
    } else if (mt.includes("text/plain") || mt.startsWith("text/") || mt === "") {
      text = await extractFromText(buffer, mime)
    } else {
      return new Response(JSON.stringify({ error: `Unsupported mime type: ${mime}` }), { status: 415 })
    }

    // Basic sanitization/trim
    text = text.replace(/\u0000/g, "").trim()

    return new Response(JSON.stringify({ text, length: text.length }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  } catch (err: any) {
    console.error("extract error", err)
    return new Response(JSON.stringify({ error: "Extraction failed", detail: String(err?.message || err) }), {
      status: 500,
    })
  }
}
