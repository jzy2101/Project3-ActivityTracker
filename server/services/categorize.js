const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-20b';
const FALLBACK_CATEGORY = 'Other';
const REQUEST_TIMEOUT_MS = 10000;

export async function categorizeActivity(name, categories) {
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is missing; defaulting to fallback category');
    return FALLBACK_CATEGORY;
  }

  if (!Array.isArray(categories) || categories.length === 0) {
    console.error('No categories available; defaulting to fallback category');
    return FALLBACK_CATEGORY;
  }

  const prompt = `Classify the activity into exactly one of these categories: ${categories.join(', ')}.
Respond with only the category name, nothing else.

Activity: "${name}"`;

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (!response.ok) {
      throw new Error(`Groq API responded with status ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? '';
    const match = categories.find((category) => category.toLowerCase() === raw.toLowerCase());

    return match ?? FALLBACK_CATEGORY;
  } catch (error) {
    console.error('Failed to categorize activity:', error.message);
    return FALLBACK_CATEGORY;
  }
}
