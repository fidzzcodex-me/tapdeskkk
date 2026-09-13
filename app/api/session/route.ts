import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/store";

function buildSnippet(host: string, id: string) {
  return `<script src="${host}/tapdesk.js" data-session="${id}" data-sync="true"></script>`;
}

function buildBookmarklet(host: string, id: string) {
  const code = `(function(){var s=document.createElement('script');s.src='${host}/tapdesk.js';s.setAttribute('data-session','${id}');s.setAttribute('data-sync','true');document.body.appendChild(s);})();`;
  return `javascript:${encodeURIComponent(code)}`;
}

export async function POST(req: NextRequest) {
  const session = createSession();
  const host = req.nextUrl.origin;
  return NextResponse.json({
    sessionId: session.id,
    snippet: buildSnippet(host, session.id),
    bookmarklet: buildBookmarklet(host, session.id),
  });
}
