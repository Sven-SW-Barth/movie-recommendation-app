import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from 'ai'
import { z } from 'zod'
import { categories, CATEGORY_GUIDE, ICON_NAMES } from '@/lib/catalog'

export const maxDuration = 30

// Build the 9-axis weights schema from the shared category list so the model's
// output always lines up exactly with the movie scoring axes.
const weightsShape = Object.fromEntries(
  categories.map((c) => [
    c.id,
    z
      .number()
      .min(0)
      .max(100)
      .describe(`${c.label}: ${c.hint}. 50 = neutral, higher = wants more.`),
  ]),
) as Record<string, z.ZodNumber>

const proposeMood = tool({
  description:
    'Call this ONLY once you understand the user\'s mood well enough. ' +
    'Translate the whole conversation into a weighted taste profile.',
  inputSchema: z.object({
    name: z
      .string()
      .describe('A short, evocative 2-4 word name for this mood/profile.'),
    icon: z
      .enum(ICON_NAMES as unknown as [string, ...string[]])
      .describe('The icon that best fits the mood.'),
    summary: z
      .string()
      .describe('One warm sentence reflecting back what they are after.'),
    weights: z
      .object(weightsShape)
      .describe(
        'Score 0-100 for every axis. 50 is neutral. Push axes they want UP ' +
          '(70-100) and axes they dislike or want to avoid DOWN (0-30).',
      ),
  }),
})

const SYSTEM = `You are the film concierge for "Reel Mood", a curated arthouse movie app.
Your job is to interview the user in a warm, concise, editorial voice to understand the EXACT mood they want to watch in, then translate it into a taste profile.

Find out, through natural conversation:
- How they FEEL right now (e.g. drained, restless, heartbroken, giddy).
- WHERE/the setting (alone on the couch, a date, friends over, late night, hungover Sunday).
- The VIBE they want (something light, something intellectual, a good cry, pure comfort, a mind-bender).
- What they do NOT want / dislike (no gore, nothing slow, no romance, etc.).

Rules:
- Keep every message to 1-3 short sentences. Ask ONE focused question at a time.
- If the first message is vague ("I'm bored", "dunno"), ask a brief, friendly follow-up. Do NOT propose a mood yet.
- Once you have a reasonably clear picture (usually after 1-3 exchanges), call the proposeMood tool. Do not over-interrogate.
- When you call proposeMood: turn likes into high scores (70-100) and explicit dislikes into low scores (0-30); leave everything else near 50.
- Suggest a short, evocative name (e.g. "Sunday Hangover", "Quiet Ache", "Brain Snacks").
- Never list the internal category names to the user. Talk like a human, not a form.

The internal taste axes you are scoring are:
${CATEGORY_GUIDE}`

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: 'openai/gpt-5.4-mini',
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    tools: { proposeMood },
    stopWhen: stepCountIs(2),
  })

  return result.toUIMessageStreamResponse()
}
