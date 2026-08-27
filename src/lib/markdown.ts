// Tiny markdown renderer — headings, bold, code, lists, tables, hr.
// No dependencies on purpose: the light edition must stay small.

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 rounded text-[0.9em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function isTableRow(t: string): boolean {
  return t.startsWith("|") && t.endsWith("|");
}

function isTableDivider(t: string): boolean {
  return isTableRow(t) && /^\|[\s:|-]+\|$/.test(t);
}

function cells(t: string): string[] {
  return t
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim());
}

export function mdToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    const isListItem = /^[-•]\s+/.test(t) || /^[0-9٠-٩][-.)]\s+/.test(t);
    if (!isListItem) closeList();

    if (t === "") continue;

    // Table: a header row, a divider row, then body rows.
    if (isTableRow(t) && isTableDivider((lines[i + 1] ?? "").trim())) {
      const head = cells(t);
      const body: string[][] = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i].trim())) {
        body.push(cells(lines[i].trim()));
        i++;
      }
      i--;
      out.push(
        '<div class="overflow-x-auto my-4"><table class="w-full text-sm border border-slate-200">' +
          '<thead class="bg-slate-100"><tr>' +
          head
            .map(
              (c) =>
                `<th class="border border-slate-200 px-3 py-2 text-start font-medium">${inline(c)}</th>`
            )
            .join("") +
          "</tr></thead><tbody>" +
          body
            .map(
              (row) =>
                "<tr>" +
                row
                  .map(
                    (c) =>
                      `<td class="border border-slate-200 px-3 py-2 align-top">${inline(c)}</td>`
                  )
                  .join("") +
                "</tr>"
            )
            .join("") +
          "</tbody></table></div>"
      );
      continue;
    }

    if (t === "---") {
      out.push('<hr class="my-5 border-slate-200" />');
      continue;
    }
    if (t.startsWith("# ")) {
      out.push(`<h1 class="text-2xl font-semibold mt-2 mb-3">${inline(t.slice(2))}</h1>`);
      continue;
    }
    if (t.startsWith("## ")) {
      out.push(
        `<h2 class="text-lg font-semibold text-emerald-700 mt-6 mb-2">${inline(t.slice(3))}</h2>`
      );
      continue;
    }
    if (isListItem) {
      if (!inList) {
        out.push('<ul class="list-disc ps-6 space-y-1 my-2">');
        inList = true;
      }
      out.push(`<li>${inline(t.replace(/^[-•]\s+/, ""))}</li>`);
      continue;
    }
    out.push(`<p class="my-2 leading-relaxed">${inline(t)}</p>`);
  }
  closeList();
  return out.join("\n");
}
