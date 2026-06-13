import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { FinalizeSessionRequest } from "@lightcode/shared"
import { prisma } from "@lightcode/database"

const validateBody = zValidator("json", FinalizeSessionRequest)

const sessions = new Hono()
  .post("/finalize", validateBody, async (c) => {
    const body = c.req.valid("json")

    // Validate the session exists before trying to write to it
    if (body.sessionId) {
      const exists = await prisma.conversation.findUnique({
        where: { id: body.sessionId },
        select: { id: true },
      })
      if (!exists) {
        return c.json({ message: "Session not found" }, 404)
      }
    }

    const now = new Date()
    // Stagger timestamps by 1ms so user always sorts before assistant
    const userAt = now
    const assistantAt = new Date(now.getTime() + 1)

    const sessionId = await prisma.$transaction(async (tx) => {
      let id = body.sessionId
      if (!id) {
        const session = await tx.conversation.create({
          data: { title: body.userContent.slice(0, 100) },
        })
        id = session.id
      }

      await tx.message.createMany({
        data: [
          { role: "user", content: body.userContent, conversationId: id, createdAt: userAt },
          { role: "assistant", content: body.assistantContent, conversationId: id, createdAt: assistantAt },
        ],
      })

      await tx.conversation.update({
        where: { id },
        data: { updatedAt: now },
      })

      return id
    })

    return c.json({ sessionId })
  })
  .get("/", async (c) => {
    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
    })
    return c.json(conversations)
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id")
    const session = await prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    })
    if (!session) {
      return c.json({ message: "Session not found" }, 404)
    }
    return c.json(session)
  })

export default sessions
