# Prompts for Gemini

## Final prompt used

You are an expert quiz generator. Produce **exact JSON only** matching the schema below. Topic: "{{topic}}". Difficulty: "{{difficulty}}". Create exactly 5 multiple-choice questions. Each question must have exactly 4 options. Mark the correct option with "correct_index" (0-based). Do NOT include any commentary, markdown, or extra fields outside the schema. Keep questions concise (<=2 sentences). Provide short explanation for each answer (1-2 sentences). Output must be valid JSON.

Schema:
{
  "topic":"string",
  "questions":[
    {
      "id":"q1",
      "question":"string",
      "options":["a","b","c","d"],
      "correct_index":0,
      "explanation":"string"
    }
  ],
  "meta":{"difficulty":"easy|medium|hard","source_hint":"string"}
}

## Notes and refinements
- Explicitly requested JSON-only output to reduce markdown wrapping.
- Added strict counts (5 questions, 4 options) and 0-based index.
- Included a validation and auto-repair pass server-side for resilience.
