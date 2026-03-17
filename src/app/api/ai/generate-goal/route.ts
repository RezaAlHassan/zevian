import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'AI service not configured. Please set GEMINI_API_KEY in your environment.' },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const prompt = body.prompt || body.description

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      }
    })

    const systemPrompt = `You are an expert performance management consultant for Zevian, a team performance tracking platform.

Given a user's description of their team or work type, generate a structured performance goal with:
1. A clear, actionable goal name (max 8 words)
2. Specific evaluation instructions (4-6 bullet points, each on a new line starting with a newline character). These instructions tell the AI evaluator what to look for when scoring employee reports.
3. 3-5 scoring criteria with importance levels (low, medium, high, critical) and percentage weights that sum to 100.

IMPORTANT: Respond ONLY with valid JSON in this exact format, no markdown, no code blocks:
{
  "name": "Goal Name Here",
  "instructions": "First instruction.\\nSecond instruction.\\nThird instruction.\\nFourth instruction.",
  "criteria": [
    { "name": "Criterion Name", "importance": "critical", "weight": 40 },
    { "name": "Another Criterion", "importance": "high", "weight": 30 },
    { "name": "Third Criterion", "importance": "medium", "weight": 30 }
  ]
}

Rules:
- Weights MUST sum to exactly 100
- Use exactly 3-5 criteria
- importance must be one of: low, medium, high, critical
- Instructions should be specific, measurable evaluation rules
- Make criteria names concise (2-3 words each)`

    let result: any;
    let retries = 3;
    let delay = 2000;

    while (retries > 0) {
      try {
        result = await model.generateContent([
          { text: systemPrompt },
          { text: `User description: "${prompt}"\n\nGenerate the performance goal JSON:` }
        ])
        break; // Success
      } catch (err: any) {
        const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Too Many Requests');
        if (isRateLimit && retries > 1) {
          console.warn(`[generate-goal] Rate limit hit. Retrying in ${delay}ms... (${retries - 1} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries--;
          delay *= 2;
        } else {
          throw err;
        }
      }
    }

    const responseText = result.response.text().trim()

    // Clean response — remove markdown code blocks if present
    const jsonStr = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const parsed = JSON.parse(jsonStr)

    // Validate structure
    if (!parsed.name || !parsed.instructions || !Array.isArray(parsed.criteria) || parsed.criteria.length === 0) {
      return NextResponse.json({ error: 'AI returned an incomplete response. Please try again.' }, { status: 500 })
    }

    // Ensure weights sum to 100
    const totalWeight = parsed.criteria.reduce((sum: number, c: any) => sum + (c.weight || 0), 0)
    if (totalWeight !== 100) {
      // Normalize
      parsed.criteria = parsed.criteria.map((c: any, i: number) => ({
        ...c,
        weight: i === parsed.criteria.length - 1
          ? 100 - parsed.criteria.slice(0, -1).reduce((s: number, cr: any) => s + Math.round(((cr.weight || 0) / totalWeight) * 100), 0)
          : Math.round(((c.weight || 0) / totalWeight) * 100)
      }))
    }

    return NextResponse.json({ data: parsed })
  } catch (err: any) {
    console.error('[Gemini API] Error generating goal:', err)

    const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Too Many Requests') || err?.message?.includes('Quota');
    if (isRateLimit) {
      return NextResponse.json({ error: 'AI Goal Generation is currently busy due to high traffic or quota limits. Please try again in a minute.' }, { status: 429 })
    }

    if (err.message?.includes('JSON')) {
      return NextResponse.json({ error: 'AI returned an unparseable response. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ error: err.message || 'Failed to generate goal with AI' }, { status: 500 })
  }
}
