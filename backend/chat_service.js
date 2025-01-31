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
{
    "f1_summary": {
        "columns": [
            {
                "name": "race_id",
                "type": "INTEGER",
                "description": "Unique identifier for each race."
            },
            {
                "name": "season_year",
                "type": "INTEGER",
                "description": "Year of the racing season."
            },
            {
                "name": "round",
                "type": "INTEGER",
                "description": "Round number of the race within the season."
            },
            {
                "name": "race_name",
                "type": "TEXT",
                "description": "Name of the race."
            },
            {
                "name": "race_date",
                "type": "TEXT",
                "description": "Date when the race took place."
            },
            {
                "name": "circuit_name",
                "type": "TEXT",
                "description": "Name of the circuit where the race was held."
            },
            {
                "name": "circuit_location",
                "type": "TEXT",
                "description": "Location of the circuit."
            },
            {
                "name": "circuit_country",
                "type": "TEXT",
                "description": "Country where the circuit is located."
            },
            {
                "name": "driver_id",
                "type": "TEXT",
                "description": "Unique identifier for each driver."
            },
            {
                "name": "driver_code",
                "type": "TEXT",
                "description": "Code representing the driver."
            },
            {
                "name": "driver_number",
                "type": "INTEGER",
                "description": "Number assigned to the driver."
            },
            {
                "name": "driver_name",
                "type": "TEXT",
                "description": "Full name of the driver."
            },
            {
                "name": "driver_dob",
                "type": "TEXT",
                "description": "Date of birth of the driver."
            },
            {
                "name": "driver_nationality",
                "type": "TEXT",
                "description": "Nationality of the driver."
            },
            {
                "name": "constructor_id",
                "type": "TEXT",
                "description": "Unique identifier for each constructor."
            },
            {
                "name": "constructor_name",
                "type": "TEXT",
                "description": "Name of the constructor."
            },
            {
                "name": "constructor_nationality",
                "type": "TEXT",
                "description": "Nationality of the constructor."
            },
            {
                "name": "grid_position",
                "type": "INTEGER",
                "description": "Starting position of the driver on the grid."
            },
            {
                "name": "race_position",
                "type": "INTEGER",
                "description": "Final position of the driver in the race."
            },
            {
                "name": "points",
                "type": "REAL",
                "description": "Points earned by the driver in the race."
            },
            {
                "name": "laps_completed",
                "type": "INTEGER",
                "description": "Number of laps completed by the driver."
            },
            {
                "name": "status",
                "type": "TEXT",
                "description": "Status of the driver at the end of the race (e.g., Finished, Retired)."
            },
            {
                "name": "fastest_lap",
                "type": "INTEGER",
                "description": "Fastest lap number completed by the driver."
            },
            {
                "name": "fastest_lap_time",
                "type": "TEXT",
                "description": "Time taken for the fastest lap."
            }
        ]
    },
    "pit_stops": {
        "columns": [
            {
                "name": "pit_stop_id",
                "type": "INTEGER",
                "description": "Unique identifier for each pit stop."
            },
            {
                "name": "race_id",
                "type": "INTEGER",
                "description": "Unique identifier for the race associated with the pit stop."
            },
            {
                "name": "driver_id",
                "type": "TEXT",
                "description": "Unique identifier for the driver associated with the pit stop."
            },
            {
                "name": "stop",
                "type": "INTEGER",
                "description": "The stop number during the race."
            },
            {
                "name": "lap",
                "type": "INTEGER",
                "description": "Lap number during which the pit stop occurred."
            },
            {
                "name": "time",
                "type": "TEXT",
                "description": "Time at which the pit stop occurred."
            },
            {
                "name": "duration",
                "type": "TEXT",
                "description": "Duration of the pit stop."
            }
        ]
    },
    "qualifying_results": {
        "columns": [
            {
                "name": "qualifying_id",
                "type": "INTEGER",
                "description": "Unique identifier for each qualifying result."
            },
            {
                "name": "race_id",
                "type": "INTEGER",
                "description": "Unique identifier for the race associated with the qualifying result."
            },
            {
                "name": "driver_id",
                "type": "TEXT",
                "description": "Unique identifier for the driver associated with the qualifying result."
            },
            {
                "name": "constructor_id",
                "type": "TEXT",
                "description": "Unique identifier for the constructor associated with the qualifying result."
            },
            {
                "name": "position",
                "type": "INTEGER",
                "description": "Position achieved by the driver in the qualifying session."
            },
            {
                "name": "q1_time",
                "type": "TEXT",
                "description": "Time achieved by the driver in Q1."
            },
            {
                "name": "q2_time",
                "type": "TEXT",
                "description": "Time achieved by the driver in Q2."
            },
            {
                "name": "q3_time",
                "type": "TEXT",
                "description": "Time achieved by the driver in Q3."
            }
        ]
    },
    "driver_standings": {
        "columns": [
            {
                "name": "standing_id",
                "type": "INTEGER",
                "description": "Unique identifier for each driver standing."
            },
            {
                "name": "race_id",
                "type": "INTEGER",
                "description": "Unique identifier for the race associated with the driver standing."
            },
            {
                "name": "driver_id",
                "type": "TEXT",
                "description": "Unique identifier for the driver."
            },
            {
                "name": "points",
                "type": "REAL",
                "description": "Points earned by the driver in the race."
            },
            {
                "name": "position",
                "type": "INTEGER",
                "description": "Position of the driver in the standings."
            },
            {
                "name": "wins",
                "type": "INTEGER",
                "description": "Number of wins by the driver."
            }
        ]
    },
    "constructor_standings": {
        "columns": [
            {
                "name": "standing_id",
                "type": "INTEGER",
                "description": "Unique identifier for each constructor standing."
            },
            {
                "name": "race_id",
                "type": "INTEGER",
                "description": "Unique identifier for the race associated with the constructor standing."
            },
            {
                "name": "constructor_id",
                "type": "TEXT",
                "description": "Unique identifier for the constructor."
            },
            {
                "name": "points",
                "type": "REAL",
                "description": "Points earned by the constructor in the race."
            },
            {
                "name": "position",
                "type": "INTEGER",
                "description": "Position of the constructor in the standings."
            },
            {
                "name": "wins",
                "type": "INTEGER",
                "description": "Number of wins by the constructor."
            }
        ]
    }
}
</SCHEMA>
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

    async generateResponse(prompt, queryResult) {
        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a Formula 1 expert assistant. Your task is to provide clear, natural responses to questions about F1 using the data provided. Keep responses concise and conversational. Only use the information given in the data - do not make assumptions or add information not present in the data."
                    },
                    {
                        role: "user",
                        content: `Question: "${prompt}"\nData: ${JSON.stringify(queryResult)}\n\nPlease provide a natural, conversational response using only the information from the data provided.`
                    }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 1,
                stop: null,
                stream: false
            });

            return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response based on the available data.';
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }

    async generateEchartOptions(queryResult) {
        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a Formula 1 expert assistant. Your task is to generate ECharts visualization options based on the provided data. Format your response as a markdown code block with the 'echarts' language specifier. The content inside the code block must be a valid JSON object (not a JavaScript object). Do not include 'option = ' or any other JavaScript syntax - just the pure JSON object. Example format:\n\n```echarts\n{\n  \"title\": { \"text\": \"F1 Stats\" },\n  \"xAxis\": { \"type\": \"category\" }\n}\n```"
                    },
                    {
                        role: "user",
                        content: `Data: ${JSON.stringify(queryResult)}\n\nGenerate ECharts options as a JSON object to visualize this data effectively.`
                    }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 1,
                stop: null,
                stream: false
            });

            return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response based on the available data.';
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }
}

export default ChatService;
