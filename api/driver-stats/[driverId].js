import { sql } from '../_db.js';

export default async function handler(req, res) {
  try {
    const { driverId } = req.query;
    const { year } = req.query;

    let pointsPromise, positionsPromise, statsPromise, qualifyingVsRacePromise, teammateComparisonPromise;
    
    if (year) {
      pointsPromise = sql`
        SELECT 
          r.round,
          r.name AS "raceName",
          COALESCE(rr.points, 0) AS race_points,
          COALESCE(sr.points, 0) AS sprint_points,
          COALESCE(rr.points, 0) + COALESCE(sr.points, 0) AS points
        FROM races r
        JOIN seasons s ON r.season_id = s.season_id
        LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ${driverId}
        LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = ${driverId}
        WHERE s.year = ${year}
        ORDER BY s.year, r.round
      `;
      
      positionsPromise = sql`
        SELECT 
          r.round,
          r.name AS "raceName",
          rr.position AS position,
          rr.grid AS grid
        FROM races r
        JOIN seasons s ON r.season_id = s.season_id
        LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ${driverId}
        WHERE s.year = ${year}
        ORDER BY s.year, r.round
      `;
      
      statsPromise = sql`
        SELECT 
          COUNT(DISTINCT r.race_id) AS "totalRaces",
          COUNT(CASE WHEN rr.position = 1 THEN 1 END) AS wins,
          COUNT(CASE WHEN rr.position <= 3 THEN 1 END) AS podiums,
          COUNT(CASE WHEN rr.position <= 10 THEN 1 END) AS "pointFinishes",
          COUNT(CASE WHEN rr.position IS NOT NULL THEN 1 END) AS "finishedRaces",
          ROUND(AVG(CASE WHEN rr.position IS NOT NULL THEN rr.position::numeric END), 2) AS "avgFinishPosition",
          SUM(COALESCE(rr.points, 0) + COALESCE(sr.points, 0)) AS "totalPoints"
        FROM races r
        JOIN seasons s ON r.season_id = s.season_id
        LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ${driverId}
        LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = ${driverId}
        WHERE s.year = ${year}
      `;
      
      qualifyingVsRacePromise = sql`
        SELECT 
          r.round,
          r.name AS "raceName",
          COALESCE(q.position, 20) AS qualifying_position,
          COALESCE(rr.position, 20) AS race_position,
          COALESCE(rr.position, 20) - COALESCE(q.position, 20) AS positions_gained
        FROM races r
        JOIN seasons s ON r.season_id = s.season_id
        LEFT JOIN qualifying_results q ON r.race_id = q.race_id AND q.driver_id = ${driverId}
        LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ${driverId}
        WHERE s.year = ${year}
        ORDER BY s.year, r.round
      `;
      
      teammateComparisonPromise = sql`
        WITH SelectedDriverConstructor AS (
          SELECT rr.constructor_id
          FROM race_results rr
          WHERE rr.driver_id = ${driverId}
          ORDER BY rr.race_id DESC
          LIMIT 1
        )
        SELECT 
          r.round,
          r.name AS "raceName",
          rr.driver_id AS driver_id,
          d.code AS driver_code,
          rr.position
        FROM races r
        JOIN seasons s ON r.season_id = s.season_id
        JOIN race_results rr ON r.race_id = rr.race_id
        JOIN SelectedDriverConstructor sdc ON rr.constructor_id = sdc.constructor_id
        JOIN drivers d ON rr.driver_id = d.driver_id
        WHERE s.year = ${year}
        ORDER BY s.year, r.round
      `;
    } else {
      pointsPromise = sql`
        SELECT 
          r.round,
          r.name AS "raceName",
          COALESCE(rr.points, 0) AS race_points,
          COALESCE(sr.points, 0) AS sprint_points,
          COALESCE(rr.points, 0) + COALESCE(sr.points, 0) AS points
        FROM races r
        JOIN seasons s ON r.season_id = s.season_id
        LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ${driverId}
        LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = ${driverId}
        ORDER BY s.year, r.round
      `;
      
      positionsPromise = sql`
        SELECT 
          r.round,
          r.name AS "raceName",
          rr.position AS position,
          rr.grid AS grid
        FROM races r
        JOIN seasons s ON r.season_id = s.season_id
        LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ${driverId}
        ORDER BY s.year, r.round
      `;
      
      statsPromise = sql`
        SELECT 
          COUNT(DISTINCT r.race_id) AS "totalRaces",
          COUNT(CASE WHEN rr.position = 1 THEN 1 END) AS wins,
          COUNT(CASE WHEN rr.position <= 3 THEN 1 END) AS podiums,
          COUNT(CASE WHEN rr.position <= 10 THEN 1 END) AS "pointFinishes",
          COUNT(CASE WHEN rr.position IS NOT NULL THEN 1 END) AS "finishedRaces",
          ROUND(AVG(CASE WHEN rr.position IS NOT NULL THEN rr.position::numeric END), 2) AS "avgFinishPosition",
          SUM(COALESCE(rr.points, 0) + COALESCE(sr.points, 0)) AS "totalPoints"
        FROM races r
        JOIN seasons s ON r.season_id = s.season_id
        LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ${driverId}
        LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = ${driverId}
      `;
      
      qualifyingVsRacePromise = sql`
        SELECT 
          r.round,
          r.name AS "raceName",
          COALESCE(q.position, 20) AS qualifying_position,
          COALESCE(rr.position, 20) AS race_position,
          COALESCE(rr.position, 20) - COALESCE(q.position, 20) AS positions_gained
        FROM races r
        JOIN seasons s ON r.season_id = s.season_id
        LEFT JOIN qualifying_results q ON r.race_id = q.race_id AND q.driver_id = ${driverId}
        LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.driver_id = ${driverId}
        ORDER BY s.year, r.round
      `;
      
      teammateComparisonPromise = sql`
        WITH SelectedDriverConstructor AS (
          SELECT rr.constructor_id
          FROM race_results rr
          WHERE rr.driver_id = ${driverId}
          ORDER BY rr.race_id DESC
          LIMIT 1
        )
        SELECT 
          r.round,
          r.name AS "raceName",
          rr.driver_id AS driver_id,
          d.code AS driver_code,
          rr.position
        FROM races r
        JOIN seasons s ON r.season_id = s.season_id
        JOIN race_results rr ON r.race_id = rr.race_id
        JOIN SelectedDriverConstructor sdc ON rr.constructor_id = sdc.constructor_id
        JOIN drivers d ON rr.driver_id = d.driver_id
        ORDER BY s.year, r.round
      `;
    }

    const [pointsData, positionsData, statsData, qualifyingVsRaceData, teammateComparisonData] = await Promise.all([
      pointsPromise,
      positionsPromise,
      statsPromise,
      qualifyingVsRacePromise,
      teammateComparisonPromise,
    ]);

    res.status(200).json({
      pointsProgression: pointsData.rows,
      racePositions: positionsData.rows,
      stats: statsData.rows[0] || {},
      qualifyingVsRace: qualifyingVsRaceData.rows,
      teammateComparison: teammateComparisonData.rows,
    });
  } catch (err) {
    console.error('Error in /api/driver-stats/[driverId]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
