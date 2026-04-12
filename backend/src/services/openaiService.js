const OpenAI = require('openai');

/**
 * Returns short natural-language reasons to attend recommended events.
 * Falls back gracefully when API key is missing.
 */
async function explainRecommendations(userName, eventTitles) {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !eventTitles.length) {
    return eventTitles.map((t) => ({ title: t, reason: 'Popular on campus right now.' }));
  }

  const client = new OpenAI({ apiKey: key });
  const prompt = `User "${userName}" might like these campus events (titles only): ${eventTitles.join(
    '; '
  )}. For each title, respond with one JSON array of objects {"title","reason"} with a friendly 1-sentence reason (max 25 words). Only valid JSON, no markdown.`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || '[]';
  try {
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* ignore */
  }
  return eventTitles.map((t) => ({ title: t, reason: 'Matches your interests and campus activity.' }));
}

async function campusAssistantChat(messages) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      reply:
        'AI is offline (set OPENAI_API_KEY). You can still use QR attendance, resource booking, events, and forums from the sidebar.',
      usedOpenAI: false,
    };
  }
  const client = new OpenAI({ apiKey: key });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are the Smart Campus OS assistant for a university. Help with attendance rules (QR + geofence), events, library loans, lab bookings, hostel, lost & found, and forums. Short paragraphs, bullet lists when helpful.',
      },
      ...messages,
    ],
    max_tokens: 600,
    temperature: 0.5,
  });
  const reply = completion.choices[0]?.message?.content?.trim() || '';
  return { reply, usedOpenAI: true };
}

async function narrateBrainFeed(summaryPayload) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      narrative: 'Your personalized campus feed is ready below. Enable OpenAI for a natural-language summary.',
      usedOpenAI: false,
    };
  }
  const client = new OpenAI({ apiKey: key });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `Summarize this campus dashboard JSON for the student in 3-4 sentences, friendly tone. JSON: ${JSON.stringify(
          summaryPayload
        ).slice(0, 3500)}`,
      },
    ],
    max_tokens: 250,
    temperature: 0.6,
  });
  return {
    narrative: completion.choices[0]?.message?.content?.trim() || '',
    usedOpenAI: true,
  };
}

module.exports = { explainRecommendations, campusAssistantChat, narrateBrainFeed };
