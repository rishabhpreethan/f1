import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    const { year } = req.query || {};

    const yearsResult = await sql`
      SELECT DISTINCT s.year
      FROM seasons s
      JOIN races r ON s.season_id = r.season_id
      JOIN race_results rr ON r.race_id = rr.race_id
      ORDER BY s.year DESC
    `;
    const years = yearsResult.rows.map(r => Number(r.year));

    let constructorsResult;
    if (year) {
      constructorsResult = await sql`
        SELECT DISTINCT 
          c.constructor_id,
          c.name,
          c.nationality,
          STRING_AGG(DISTINCT s.year::text, ',') AS years
        FROM constructors c
        JOIN race_results rr ON c.constructor_id = rr.constructor_id
        JOIN races r ON rr.race_id = r.race_id
        JOIN seasons s ON r.season_id = s.season_id
        WHERE s.year = ${year}
        GROUP BY c.constructor_id, c.name, c.nationality
        ORDER BY c.name
      `;
    } else {
      constructorsResult = await sql`
        SELECT DISTINCT 
          c.constructor_id,
          c.name,
          c.nationality,
          STRING_AGG(DISTINCT s.year::text, ',') AS years
        FROM constructors c
        JOIN race_results rr ON c.constructor_id = rr.constructor_id
        JOIN races r ON rr.race_id = r.race_id
        JOIN seasons s ON r.season_id = s.season_id
        GROUP BY c.constructor_id, c.name, c.nationality
        ORDER BY c.name
      `;
    }

    const constructors = constructorsResult.rows.map(row => ({
      ...row,
      years: row.years.split(',').map(n => Number(n)).sort((a, b) => b - a)
    }));

    res.status(200).json({ years, constructors });
  } catch (err) {
    console.error('Error in /api/constructors:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
