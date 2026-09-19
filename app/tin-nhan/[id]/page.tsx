import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { listMessages, markThreadRead, threadHeader } from "@/lib/api/chat"
import { Conversation } from "./conversation"

export const metadata: Metadata = {
  title: "Tin nhắn",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const header = await threadHeader(id)
  if (!header) notFound()

  const messages = await listMessages(id)
  // Opening the conversation is what marks it read.
  await markThreadRead(id)

  return <Conversation threadId={id} header={header} initial={messages} />
}
