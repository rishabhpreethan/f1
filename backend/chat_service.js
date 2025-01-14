import { Groq } from 'groq-sdk';
import sqlite3 from 'sqlite3';

class ChatService {
    constructor(apiKey) {
        this.groq = new Groq({
            apiKey: apiKey
        });
        this.systemPrompt = this.getSystemPrompt();
    }

    getSystemPrompt() {
        return `You are an AI assistant that converts natural language queries about Formula 1 into SQLite SQL queries.

IMPORTANT: Return ONLY the raw SQL query without any markdown formatting, code blocks, or additional text.

Given below within <SCHEMA> xml tags is the SQLite schema for the Formula 1 database:
<SCHEMA>
1. Table name: races
columns:
   - race_id (INTEGER PRIMARY KEY)
   - season_id (INTEGER, references seasons) 
   - circuit_id (TEXT, references circuits)
   - round (INTEGER)
   - name (TEXT)
   - date (TEXT) -- Format: YYYY-MM-DD
   - time (TEXT)
   - url (TEXT)

2. Table name: circuits
columns:
   - circuit_id (TEXT PRIMARY KEY)
   - name (TEXT)
   - location (TEXT)
   - country (TEXT) 
   - lat (REAL)
   - lng (REAL)
   - url (TEXT)

3. Table name: drivers
columns:
   - driver_id (TEXT PRIMARY KEY)
   - code (TEXT) 
   - number (INTEGER) 
   - forename (TEXT)
   - surname (TEXT)
   - dob (TEXT)
   - nationality (TEXT)
   - url (TEXT)

4. Table name: constructors
columns:
   - constructor_id (TEXT PRIMARY KEY)
   - name (TEXT) 
   - nationality (TEXT)
   - url (TEXT)

5. Table name: race_results
columns:
   - result_id (INTEGER PRIMARY KEY)
   - race_id (INTEGER, references races)
   - driver_id (TEXT, references drivers)
   - constructor_id (TEXT, references constructors)
   - grid (INTEGER) -- Starting position
   - position (INTEGER) -- Final position (NULL if DNF)
   - points (REAL)
   - laps (INTEGER)
   - status (TEXT)
   - time (TEXT)
   - fastest_lap (INTEGER)
   - fastest_lap_time (TEXT)

6. Table name: qualifying_results
columns:
   - qualifying_id (INTEGER PRIMARY KEY)
   - race_id (INTEGER, references races)
   - driver_id (TEXT, references drivers)
   - constructor_id (TEXT, references constructors)
   - position (INTEGER)
   - q1_time (TEXT) -- Q1 session time
   - q2_time (TEXT) -- Q2 session time
   - q3_time (TEXT) -- Q3 session time

7. Table name: driver_standings
columns:
   - standing_id (INTEGER PRIMARY KEY)
   - race_id (INTEGER, references races)
   - driver_id (TEXT, references drivers)
   - points (REAL) -- Cumulative points
   - position (INTEGER)
   - wins (INTEGER) -- Number of wins

8. Table name: constructor_standings
columns:
   - standing_id (INTEGER PRIMARY KEY)
   - race_id (INTEGER, references races)
   - constructor_id (TEXT, references constructors)
   - points (REAL) -- Cumulative points
   - position (INTEGER)
   - wins (INTEGER) -- Number of wins

9. Table name: status
columns:
    - status_id (INTEGER PRIMARY KEY)
    - status (TEXT) -- Reason for retirement/finish status

10. Table name: lap_times
columns:
    - lap_id (INTEGER PRIMARY KEY)
    - race_id (INTEGER, references races)
    - driver_id (TEXT, references drivers)
    - lap (INTEGER)
    - position (INTEGER)
    - time (TEXT)

11. Table name: pit_stops
columns:
    - pit_stop_id (INTEGER PRIMARY KEY)
    - race_id (INTEGER, references races)
    - driver_id (TEXT, references drivers)
    - stop (INTEGER) -- Number of the pit stop
    - lap (INTEGER)
    - time (TEXT) -- Time of day
    - duration (TEXT) -- Duration of stop
</SCHEMA>

<INSTRUCTIONS>
Common Query Patterns:
1. For driver names: Use drivers.forename and drivers.surname
2. For geographical queries: ALWAYS join races with circuits table and use circuits.country or circuits.location
3. For race positions: Use race_results.position
4. For championship standings: Use driver_standings or constructor_standings
5. For timing data: Use lap_times or qualifying_results
6. For pit stops information: Select from the pit_stops table

Follow these rules:
1. Return ONLY the raw SQL query without any markdown, code blocks, or additional text
2. ALWAYS use LEFT JOIN when joining tables - never use INNER JOIN or just JOIN
3. Use SQLite syntax (e.g., use INTEGER instead of SERIAL, TEXT instead of VARCHAR)
4. Do not escape underscores in table names
5. Do not wrap the entire query in a codeblock
6. Keep the query simple and readable
7. Use proper table aliases when joining multiple tables
8. Always include column names in SELECT statements (avoid SELECT *)
9. Make sure you use the above table and column names in your query
</INSTRUCTIONS>

<EXAMPLE>
-- Query to get pit stops for a driver at a specific circuit
SELECT 
    d.forename,
    d.surname,
    c.name as circuit_name,
    c.country,
    r.name as race_name,
    ps.stop as pit_stop_number,
    ps.duration as pit_stop_duration
FROM pit_stops ps
LEFT JOIN races r ON r.race_id = ps.race_id
LEFT JOIN drivers d ON d.driver_id = ps.driver_id
LEFT JOIN circuits c ON c.circuit_id = r.circuit_id
WHERE c.country = 'Brazil'
AND d.forename = 'Max'
AND d.surname = 'Verstappen';
</EXAMPLE>
`;
    }

    async generateQuery(prompt) {
        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: this.systemPrompt
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.5,
                max_tokens: 1024,
                top_p: 1,
                stop: null,
                stream: false
            });

            return completion.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('Error generating query:', error);
            throw error;
        }
    }

    async executeQuery(query) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database('./backend/sqlite.db');
            
            db.all(query, [], (err, rows) => {
                if (err) {
                    db.close();
                    reject(err);
                    return;
                }
                
                db.close();
                resolve(rows);
            });
        });
    }
}

export default ChatService;
