export type ParsedCommand =
  | { type: "HELP" }
  | { type: "LIST"; folderPath: string }
  | { type: "DELETE"; targetPath: string; confirm: boolean }
  | { type: "MOVE"; sourcePath: string; destFolderPath: string }
  | { type: "SUMMARY"; folderPath: string }
  | { type: "UNKNOWN"; raw: string; error?: string }

function normalizePath(p: string) {
  if (!p) return "/"
  if (!p.startsWith("/")) p = "/" + p
  // strip trailing slash except root
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1)
  return p
}

export function parseCommand(raw: string): ParsedCommand {
  const text = (raw || "").trim().replace(/\s+/g, " ")
  if (!text) return { type: "UNKNOWN", raw: text, error: "Empty command" }

  const upper = text.toUpperCase()
  if (upper === "HELP" || upper === "/HELP") return { type: "HELP" }

  const [verb, ...rest] = text.split(" ")
  switch (verb.toUpperCase()) {
    case "LIST": {
      const folder = normalizePath(rest[0] || "/")
      return { type: "LIST", folderPath: folder }
    }
    case "DELETE": {
      const confirm = rest.includes("CONFIRM")
      const target = normalizePath(rest.filter((r) => r.toUpperCase() !== "CONFIRM")[0] || "")
      if (!target) return { type: "UNKNOWN", raw: text, error: "DELETE requires a file path" }
      return { type: "DELETE", targetPath: target, confirm }
    }
    case "MOVE": {
      const src = normalizePath(rest[0] || "")
      const dst = normalizePath(rest[1] || "")
      if (!src || !dst) return { type: "UNKNOWN", raw: text, error: "MOVE requires source and destination" }
      return { type: "MOVE", sourcePath: src, destFolderPath: dst }
    }
    case "SUMMARY": {
      const folder = normalizePath(rest[0] || "/")
      return { type: "SUMMARY", folderPath: folder }
    }
    default:
      return { type: "UNKNOWN", raw: text, error: "Unknown command. Try HELP." }
  }
}
