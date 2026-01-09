import { sql } from '../_db.js';

export default async function handler(req, res) {
  try {
    const { constructorId } = req.query;
    const { year } = req.query;

    let pointsResult, statsResult;
    
    if (year) {
      pointsResult = await sql`
        WITH RaceAndSprintPoints AS (
          SELECT 
            r.round,
            r.name AS "raceName",
            COALESCE(SUM(rr.points), 0) AS race_points,
            COALESCE(SUM(sr.points), 0) AS sprint_points,
            STRING_AGG(rr.points::text, ',') AS driver_race_points
          FROM races r
          JOIN seasons s ON r.season_id = s.season_id
          LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.constructor_id = ${constructorId}
          LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = rr.driver_id
          WHERE s.year = ${year}
          GROUP BY r.round, r.name
          ORDER BY r.round
        )
        SELECT 
          round,
          "raceName",
          race_points,
          sprint_points,
          driver_race_points,
          SUM(race_points + sprint_points) OVER (ORDER BY round) AS points
        FROM RaceAndSprintPoints
        ORDER BY round
      `;
      
      statsResult = await sql`
        WITH RacePoints AS (
          SELECT COALESCE(SUM(rr.points), 0) AS race_points
          FROM race_results rr
          JOIN races r ON rr.race_id = r.race_id
          JOIN seasons s ON r.season_id = s.season_id
          WHERE rr.constructor_id = ${constructorId} AND s.year = ${year}
        ),
        SprintPoints AS (
          SELECT COALESCE(SUM(sr.points), 0) AS sprint_points
          FROM sprint_results sr
          JOIN races r ON sr.race_id = r.race_id
          JOIN seasons s ON r.season_id = s.season_id
          JOIN race_results rr ON sr.race_id = rr.race_id AND sr.driver_id = rr.driver_id
          WHERE rr.constructor_id = ${constructorId} AND s.year = ${year}
        )
        SELECT 
          COUNT(DISTINCT r.race_id) AS "totalRaces",
          COUNT(CASE WHEN rr.position = 1 THEN 1 END) AS wins,
          COUNT(CASE WHEN sr.position = 1 THEN 1 END) AS "sprintWins",
          COUNT(CASE WHEN rr.position <= 3 THEN 1 END) AS podiums,
          COUNT(CASE WHEN rr.position <= 10 THEN 1 END) AS "pointFinishes",
          COUNT(CASE WHEN rr.position IS NOT NULL THEN 1 END) AS "finishedRaces",
          ROUND(AVG(CASE WHEN rr.position IS NOT NULL THEN rr.position::numeric END), 2) AS "avgFinishPosition",
          (SELECT race_points + sprint_points FROM RacePoints, SprintPoints) AS "totalPoints"
        FROM races r
        JOIN seasons s ON r.season_id = s.season_id
        LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.constructor_id = ${constructorId}
        LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = rr.driver_id
        WHERE s.year = ${year}
      `;
    } else {
      pointsResult = await sql`
        WITH RaceAndSprintPoints AS (
          SELECT 
            r.round,
            r.name AS "raceName",
            COALESCE(SUM(rr.points), 0) AS race_points,
            COALESCE(SUM(sr.points), 0) AS sprint_points,
            STRING_AGG(rr.points::text, ',') AS driver_race_points
          FROM races r
          JOIN seasons s ON r.season_id = s.season_id
          LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.constructor_id = ${constructorId}
          LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = rr.driver_id
          GROUP BY r.round, r.name
          ORDER BY r.round
        )
        SELECT 
          round,
          "raceName",
          race_points,
          sprint_points,
          driver_race_points,
          SUM(race_points + sprint_points) OVER (ORDER BY round) AS points
        FROM RaceAndSprintPoints
        ORDER BY round
      `;
      
      statsResult = await sql`
        WITH RacePoints AS (
          SELECT COALESCE(SUM(rr.points), 0) AS race_points
          FROM race_results rr
          JOIN races r ON rr.race_id = r.race_id
          JOIN seasons s ON r.season_id = s.season_id
          WHERE rr.constructor_id = ${constructorId}
        ),
        SprintPoints AS (
          SELECT COALESCE(SUM(sr.points), 0) AS sprint_points
          FROM sprint_results sr
          JOIN races r ON sr.race_id = r.race_id
          JOIN seasons s ON r.season_id = s.season_id
          JOIN race_results rr ON sr.race_id = rr.race_id AND sr.driver_id = rr.driver_id
          WHERE rr.constructor_id = ${constructorId}
        )
        SELECT 
          COUNT(DISTINCT r.race_id) AS "totalRaces",
          COUNT(CASE WHEN rr.position = 1 THEN 1 END) AS wins,
          COUNT(CASE WHEN sr.position = 1 THEN 1 END) AS "sprintWins",
          COUNT(CASE WHEN rr.position <= 3 THEN 1 END) AS podiums,
          COUNT(CASE WHEN rr.position <= 10 THEN 1 END) AS "pointFinishes",
          COUNT(CASE WHEN rr.position IS NOT NULL THEN 1 END) AS "finishedRaces",
          ROUND(AVG(CASE WHEN rr.position IS NOT NULL THEN rr.position::numeric END), 2) AS "avgFinishPosition",
          (SELECT race_points + sprint_points FROM RacePoints, SprintPoints) AS "totalPoints"
        FROM races r
        JOIN seasons s ON r.season_id = s.season_id
        LEFT JOIN race_results rr ON r.race_id = rr.race_id AND rr.constructor_id = ${constructorId}
        LEFT JOIN sprint_results sr ON r.race_id = sr.race_id AND sr.driver_id = rr.driver_id
      `;
    }

    res.status(200).json({
      pointsProgression: pointsResult.rows,
      stats: statsResult.rows[0] || {},
      driverPoints: pointsResult.rows.map(r => ({ round: r.round, driver_race_points: r.driver_race_points })),
    });
  } catch (err) {
    console.error('Error in /api/constructor-stats/[constructorId]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
