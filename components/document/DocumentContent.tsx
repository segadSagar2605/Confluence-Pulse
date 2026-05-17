"use client";

interface Props { content: string }

function parseMarkdown(md: string): string {
  return md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^\| (.+) \|$/gm, (row) => {
      const cells = row.slice(1, -1).split("|").map((c) => c.trim());
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
    })
    .replace(/^---$/gm, "<hr />")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^([^<\n].+)$/gm, (line) => {
      if (line.startsWith("<") || line.trim() === "") return line;
      return line;
    });
}

export default function DocumentContent({ content }: Props) {
  return (
    <div
      className="confluence-content text-sm leading-relaxed"
      dangerouslySetInnerHTML={{
        __html: content
          .split("\n\n")
          .map((block) => {
            const trimmed = block.trim();
            if (!trimmed) return "";
            if (trimmed.startsWith("#")) return parseMarkdown(trimmed);
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
              const items = trimmed.split("\n").map((l) => l.replace(/^[-*] /, "").trim());
              return `<ul>${items.map((i) => `<li>${parseMarkdown(i)}</li>`).join("")}</ul>`;
            }
            if (trimmed.match(/^\d+\./)) {
              const items = trimmed.split("\n").map((l) => l.replace(/^\d+\.\s*/, "").trim());
              return `<ol>${items.map((i) => `<li>${parseMarkdown(i)}</li>`).join("")}</ol>`;
            }
            if (trimmed.startsWith("|")) {
              const rows = trimmed.split("\n").filter((r) => r.trim() && !r.match(/^\|[-:| ]+\|$/));
              return `<table>${rows.map((r) => {
                const cells = r.slice(1, -1).split("|").map((c) => c.trim());
                return `<tr>${cells.map((c) => `<td>${parseMarkdown(c)}</td>`).join("")}</tr>`;
              }).join("")}</table>`;
            }
            if (trimmed.startsWith("---")) return "<hr />";
            return `<p>${parseMarkdown(trimmed)}</p>`;
          })
          .join(""),
      }}
    />
  );
}
