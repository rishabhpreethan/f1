import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: "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",
});

// This is the system prompt that provides context about our database schema
const systemPrompt = `You are an AI assistant that converts natural language queries about Formula 1 into SQLite SQL queries.
You have access to the following tables:

1. races
   - race_id (INTEGER PRIMARY KEY)
   - year (INTEGER)
   - round (INTEGER)
   - circuit_id (INTEGER, references circuits)
   - name (TEXT)
   - date (TEXT)

2. drivers
   - driver_id (INTEGER PRIMARY KEY)
   - code (TEXT)
   - forename (TEXT)
   - surname (TEXT)
   - nationality (TEXT)
   - dob (TEXT)

3. constructors
   - constructor_id (INTEGER PRIMARY KEY)
   - name (TEXT)
   - nationality (TEXT)

4. results
   - result_id (INTEGER PRIMARY KEY)
   - race_id (INTEGER, references races)
   - driver_id (INTEGER, references drivers)
   - constructor_id (INTEGER, references constructors)
   - grid (INTEGER)
   - position (INTEGER)
   - points (REAL)
   - laps (INTEGER)
   - status (TEXT)

5. circuits
   - circuit_id (INTEGER PRIMARY KEY)
   - name (TEXT)
   - location (TEXT)
   - country (TEXT)
   - lat (REAL)
   - lng (REAL)

Generate only the SQL query without any additional text or explanation.
Use proper JOIN statements when querying across multiple tables.
Use SQLite syntax (e.g., use INTEGER instead of SERIAL, TEXT instead of VARCHAR).
Ensure the query is optimized and follows SQL best practices.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.1,
      max_tokens: 1024,
    });

    const sqlQuery = completion.choices[0]?.message?.content;

    if (!sqlQuery) {
      return res.status(500).json({ error: 'Failed to generate SQL query' });
    }

    return res.status(200).json({ sqlQuery });
  } catch (error) {
    console.error('Error generating query:', error);
    return res.status(500).json({ error: 'Failed to generate query' });
  }
}
