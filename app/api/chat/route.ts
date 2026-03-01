import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json();
  const message = String(body?.message ?? "");
  const sessionId = body?.sessionId as string | undefined;

  if (!message.trim()) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  // Create or reuse a session
  let sid = sessionId;
  if (!sid) {
    const { data: session, error } = await supabaseServer
      .from("chat_sessions")
      .insert({ title: message.slice(0, 60) })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    sid = session.id;
  }

  // Save user message
  const { error: insUserErr } = await supabaseServer
    .from("chat_messages")
    .insert({ session_id: sid, role: "user", content: message });

  if (insUserErr) return NextResponse.json({ error: insUserErr.message }, { status: 500 });

  // Dummy assistant response for now
  const answer = `Got it. (session ${sid}) Next we’ll add retrieval + Antigravity.`;

  // Save assistant message
  const { error: insAsstErr } = await supabaseServer
    .from("chat_messages")
    .insert({ session_id: sid, role: "assistant", content: answer });

  if (insAsstErr) return NextResponse.json({ error: insAsstErr.message }, { status: 500 });

  return NextResponse.json({ sessionId: sid, answer });
}
