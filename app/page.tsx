"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Download, MessageSquareText, ListOrdered, ShieldCheck, Wrench } from "lucide-react"
import Link from "next/link"
import { parseCommand, type ParsedCommand } from "@/lib/command-parser"

function ExampleRow({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-2 py-2 border-b last:border-b-0">
      <code className="bg-muted px-2 py-1 rounded text-sm">{cmd}</code>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

export default function HomePage() {
  const [input, setInput] = useState("LIST /ProjectX")
  const [parsed, setParsed] = useState<ParsedCommand | null>(parseCommand("LIST /ProjectX"))

  const onParse = () => {
    setParsed(parseCommand(input))
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">WhatsApp-Driven Google Drive Assistant</h1>
          <p className="text-muted-foreground max-w-3xl">
            An n8n workflow that listens to WhatsApp commands via Twilio and performs Google Drive actions (list,
            delete, move, summarize), with audit logging and safety checks. This repo includes a helper microservice for
            PDF/DOCX text extraction, docker-compose for n8n, the workflow.json, and setup docs.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" /> Get the Workflow
              </CardTitle>
              <CardDescription>Import into your n8n instance and wire credentials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Download the ready-to-import JSON and follow the README for setup and environment variables.
              </p>
              <div className="flex gap-2">
                <Link href="/ops/workflow/whatsapp-drive-assistant.json" download>
                  <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Download workflow.json
                  </Button>
                </Link>
                <Link href="/README.md" target="_blank">
                  <Button variant="outline">Open README</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5" /> Command Tester
              </CardTitle>
              <CardDescription>Try the slash-commands parser locally.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cmd">Command</Label>
                <div className="flex gap-2">
                  <Input
                    id="cmd"
                    placeholder="e.g., SUMMARY /ProjectX"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onParse()}
                  />
                  <Button onClick={onParse}>Parse</Button>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Parsed</p>
                <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(parsed, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5" /> Supported Commands
            </CardTitle>
            <CardDescription>Send these via WhatsApp to your Twilio Sandbox number.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <ExampleRow cmd="HELP" desc="Show command help" />
              <ExampleRow cmd="LIST /ProjectX" desc="List files in /ProjectX" />
              <ExampleRow cmd="DELETE /ProjectX/report.pdf" desc="Delete a single file (no confirmation needed)" />
              <ExampleRow cmd="DELETE /ProjectX/*.pdf" desc="Mass delete requires confirmation" />
              <ExampleRow cmd="DELETE /ProjectX/*.pdf CONFIRM" desc="Confirm mass deletion" />
              <ExampleRow cmd="MOVE /ProjectX/report.pdf /Archive" desc="Move a file to /Archive" />
              <ExampleRow cmd="SUMMARY /ProjectX" desc="Summarize each file in folder (PDF/DOCX/TXT supported)" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Safety and Logging
            </CardTitle>
            <CardDescription>Audit trail and mass-deletion protection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>All actions are appended to a Google Sheet (timestamp, user, command, args, status).</li>
              <li>Mass deletion guard: If a pattern resolves to multiple files, you must add CONFIRM to proceed.</li>
              <li>The workflow replies with user-friendly errors and guidance on next steps.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" /> Quick Start
            </CardTitle>
            <CardDescription>Local dev flow</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="steps">
              <TabsList>
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="twilio">Twilio Sandbox</TabsTrigger>
                <TabsTrigger value="n8n">n8n + Docker</TabsTrigger>
              </TabsList>
              <TabsContent value="steps" className="space-y-2 text-sm">
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Run this Next.js app (for the PDF/DOCX extractor API).</li>
                  <li>Start n8n via Docker Compose, import workflow.json.</li>
                  <li>Set credentials: Twilio, Google Drive, Google Sheets, OpenAI, and EXTRACTOR_URL.</li>
                  <li>Point Twilio WhatsApp sandbox inbound webhook to your n8n webhook URL.</li>
                  <li>Send commands from WhatsApp and observe responses.</li>
                </ol>
              </TabsContent>
              <TabsContent value="twilio" className="text-sm space-y-2">
                <p>
                  Configure Twilio Sandbox for WhatsApp and set the inbound webhook to your n8n Webhook Trigger URL.
                </p>
                <p>Use the sample commands above to test.</p>
              </TabsContent>
              <TabsContent value="n8n" className="text-sm space-y-2">
                <p>Use the docker-compose.yml in the ops folder. Import the workflow via n8n UI.</p>
                <p>
                  For local: set EXTRACTOR_URL to {"http://host.docker.internal:3000/api/extract"} so the n8n container
                  can reach this app.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <footer className="text-xs text-muted-foreground">
          Tip: After downloading, use the “Download Code” button in the upper right of this block to get a full repo you
          can push to GitHub or deploy on Vercel.
        </footer>
      </div>
    </main>
  )
}
