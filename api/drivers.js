import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    const { year } = req.query || {};

    // Fetch available years
    const yearsResult = await sql`
      SELECT DISTINCT s.year
      FROM seasons s
      JOIN races r ON s.season_id = r.season_id
      JOIN race_results rr ON r.race_id = rr.race_id
      ORDER BY s.year DESC
    `;
    const years = yearsResult.rows.map(r => Number(r.year));

    // Fetch drivers, optionally filtered by year
    let driversResult;
    if (year) {
      driversResult = await sql`
        SELECT DISTINCT 
          d.driver_id,
          d.code,
          d.forename,
          d.surname,
          d.nationality,
          STRING_AGG(DISTINCT s.year::text, ',') AS years
        FROM drivers d
        JOIN race_results rr ON d.driver_id = rr.driver_id
        JOIN races r ON rr.race_id = r.race_id
        JOIN seasons s ON r.season_id = s.season_id
        WHERE s.year = ${year}
        GROUP BY d.driver_id, d.code, d.forename, d.surname, d.nationality
        ORDER BY d.surname
      `;
    } else {
      driversResult = await sql`
        SELECT DISTINCT 
          d.driver_id,
          d.code,
          d.forename,
          d.surname,
          d.nationality,
          STRING_AGG(DISTINCT s.year::text, ',') AS years
        FROM drivers d
        JOIN race_results rr ON d.driver_id = rr.driver_id
        JOIN races r ON rr.race_id = r.race_id
        JOIN seasons s ON r.season_id = s.season_id
        GROUP BY d.driver_id, d.code, d.forename, d.surname, d.nationality
        ORDER BY d.surname
      `;
    }

    const drivers = driversResult.rows.map(row => ({
      ...row,
      years: row.years.split(',').map(n => Number(n)).sort((a, b) => b - a)
    }));

    res.status(200).json({ years, drivers });
  } catch (err) {
    console.error('Error in /api/drivers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
