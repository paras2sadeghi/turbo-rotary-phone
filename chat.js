const DEFAULT_ACTIONS = [
  'Talk to pharmacist',
  'Book doctor',
  'Request refill'
];

const ALL_ACTIONS = [
  'Book doctor',
  'Request refill',
  'Upload prescription',
  'Schedule delivery',
  'Talk to pharmacist'
];

const SYSTEM_PROMPT = [
  'You are Flash Pharmacy AI Pharmacist, an investor-facing demo assistant.',
  'Give polished, concise general medication and care-navigation guidance.',
  'Do not diagnose, prescribe, or claim a real clinical decision has been made.',
  'Escalate red flags clearly: chest pain, trouble breathing, severe allergic reaction, stroke symptoms, severe bleeding, suicidal thoughts, fainting, severe or sudden headache, confusion, vision loss, pregnancy concerns, or symptoms in infants.',
  'Mention pharmacist or doctor review when appropriate.',
  'End with practical next steps that match one or more available CTA actions.',
  `Available CTA actions: ${ALL_ACTIONS.join(', ')}.`
].join(' ');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function chooseActions(text) {
  const lower = String(text || '').toLowerCase();
  const actions = [];
  if (/doctor|appointment|urgent|pain|symptom|headache|fever|breath|chest/.test(lower)) {
    actions.push('Book doctor', 'Talk to pharmacist');
  }
  if (/refill|prescription|medication|medicine|rx|dose|warfarin|ibuprofen/.test(lower)) {
    actions.push('Request refill', 'Talk to pharmacist', 'Upload prescription');
  }
  if (/deliver|delivery|ship|home|pickup/.test(lower)) {
    actions.push('Schedule delivery');
  }
  if (/upload|photo|image|label|bottle/.test(lower)) {
    actions.push('Upload prescription');
  }
  return [...new Set(actions.concat(DEFAULT_ACTIONS))].slice(0, 4);
}

function safeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-8).map((message) => ({
    role: message && message.role === 'assistant' ? 'assistant' : 'user',
    content: String((message && message.content) || '').slice(0, 1400)
  })).filter((message) => message.content.trim());
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const messages = safeMessages(req.body && req.body.messages);
  const lastUser = [...messages].reverse().find((message) => message.role === 'user');
  const actions = chooseActions(lastUser && lastUser.content);

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      configured: false,
      reply: 'Live AI demo is not configured yet. Add OPENAI_API_KEY in Vercel to enable real Flash Pharmacy AI Pharmacist responses. For now, the interface can still preview the patient workflow and CTA actions.',
      actions
    });
  }

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 430,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `OpenAI request failed with ${response.status}`);
    }

    const data = await response.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';

    return res.status(200).json({
      configured: true,
      reply: reply || 'I can help with general medication guidance and prepare the right next step for pharmacist or doctor review.',
      actions
    });
  } catch (error) {
    return res.status(200).json({
      configured: false,
      reply: 'The live AI demo could not respond just now. The patient workflow is still available here: capture the question, prepare the context, and route to pharmacist or doctor review.',
      actions
    });
  }
};
