import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Simple delay helper to be nice to Ergast API
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'f1-insider-seed-script/1.0 (+https://vercel.com)'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // Ergast wraps in MRData always
      return json.MRData;
    } catch (err) {
      // Fallback to http if https fails with network error
      if (url.startsWith('https://')) {
        try {
          const httpUrl = url.replace('https://', 'http://');
          const res2 = await fetch(httpUrl, {
            headers: {
              'User-Agent': 'f1-insider-seed-script/1.0 (+https://vercel.com)'
            }
          });
          if (res2.ok) {
            const json2 = await res2.json();
            return json2.MRData;
          }
        } catch (_) {}
      }
      if (i === retries - 1) throw err;
      await delay(500 * (i + 1));
    }
  }
}

async function getOrCreateSeasonId(year) {
  const existing = await sql`SELECT season_id FROM seasons WHERE year = ${year} LIMIT 1`;
  if (existing.rows.length) return existing.rows[0].season_id;
  const inserted = await sql`INSERT INTO seasons (year, url) VALUES (${year}, ${`http://ergast.com/api/f1/${year}`}) RETURNING season_id`;
  return inserted.rows[0].season_id;
}

async function upsertCircuit(c) {
  await sql`
    INSERT INTO circuits (circuit_id, name, location, country, lat, lng, url)
    VALUES (${c.circuitId}, ${c.circuitName}, ${c.Location?.locality || null}, ${c.Location?.country || null}, ${c.Location?.lat || null}, ${c.Location?.long || null}, ${c.url})
    ON CONFLICT (circuit_id) DO UPDATE SET
      name = EXCLUDED.name,
      location = EXCLUDED.location,
      country = EXCLUDED.country,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      url = EXCLUDED.url
  `;
}

async function upsertDriver(d) {
  await sql`
    INSERT INTO drivers (driver_id, code, number, forename, surname, dob, nationality, url)
    VALUES (${d.driverId}, ${d.code || null}, ${d.permanentNumber || null}, ${d.givenName}, ${d.familyName}, ${d.dateOfBirth || null}, ${d.nationality || null}, ${d.url})
    ON CONFLICT (driver_id) DO UPDATE SET
      code = EXCLUDED.code,
      number = EXCLUDED.number,
      forename = EXCLUDED.forename,
      surname = EXCLUDED.surname,
      dob = EXCLUDED.dob,
      nationality = EXCLUDED.nationality,
      url = EXCLUDED.url
  `;
}

async function upsertConstructor(c) {
  await sql`
    INSERT INTO constructors (constructor_id, name, nationality, url)
    VALUES (${c.constructorId}, ${c.name}, ${c.nationality || null}, ${c.url})
    ON CONFLICT (constructor_id) DO UPDATE SET
      name = EXCLUDED.name,
      nationality = EXCLUDED.nationality,
      url = EXCLUDED.url
  `;
}

async function upsertRace(seasonId, race) {
  // Ensure circuit first
  if (race.Circuit) await upsertCircuit(race.Circuit);
  const date = race.date ? race.date : null;
  const time = race.time ? race.time : null;
  await sql`
    INSERT INTO races (season_id, round, name, date, time, url)
    VALUES (${seasonId}, ${Number(race.round)}, ${race.raceName}, ${date}, ${time}, ${race.url})
    ON CONFLICT (race_id) DO NOTHING
  `;
}

async function getRaceId(seasonId, round) {
  const r = await sql`SELECT race_id FROM races WHERE season_id = ${seasonId} AND round = ${Number(round)} LIMIT 1`;
  return r.rows[0]?.race_id || null;
}

async function insertRaceResults(raceId, results) {
  if (!results) return;
  for (const result of results) {
    await sql`
      INSERT INTO race_results (
        race_id, driver_id, constructor_id, grid, position, points, laps, status, time, fastest_lap, fastest_lap_time
      ) VALUES (
        ${raceId}, ${result.Driver?.driverId}, ${result.Constructor?.constructorId}, ${result.grid || null}, ${result.position || null},
        ${Number(result.points || 0)}, ${result.laps || null}, ${result.status || null}, ${result.Time?.time || null},
        ${result.FastestLap?.lap || null}, ${result.FastestLap?.Time?.time || null}
      )
      ON CONFLICT DO NOTHING
    `;
  }
}

async function insertQualifyingResults(raceId, qual) {
  if (!qual) return;
  for (const result of qual) {
    await sql`
      INSERT INTO qualifying_results (
        race_id, driver_id, constructor_id, position, q1_time, q2_time, q3_time
      ) VALUES (
        ${raceId}, ${result.Driver?.driverId}, ${result.Constructor?.constructorId}, ${result.position || null},
        ${result.Q1 || null}, ${result.Q2 || null}, ${result.Q3 || null}
      )
      ON CONFLICT DO NOTHING
    `;
  }
}

async function insertSprintResults(raceId, sprint) {
  if (!sprint) return;
  for (const result of sprint) {
    await sql`
      INSERT INTO sprint_results (
        race_id, driver_id, constructor_id, position, grid, points, laps, status, time, fastest_lap, fastest_lap_time
      ) VALUES (
        ${raceId}, ${result.Driver?.driverId}, ${result.Constructor?.constructorId}, ${result.position || null}, ${result.grid || null},
        ${Number(result.points || 0)}, ${result.laps || null}, ${result.status || null}, ${result.Time?.time || null},
        ${result.FastestLap?.lap || null}, ${result.FastestLap?.Time?.time || null}
      )
      ON CONFLICT DO NOTHING
    `;
  }
}

async function insertDriverStandings(raceId, standings) {
  if (!standings) return;
  for (const s of standings) {
    await sql`
      INSERT INTO driver_standings (
        race_id, driver_id, points, position, wins
      ) VALUES (
        ${raceId}, ${s.Driver?.driverId}, ${Number(s.points || 0)}, ${Number(s.position || 0)}, ${Number(s.wins || 0)}
      )
      ON CONFLICT (race_id, driver_id) DO UPDATE SET
        points = EXCLUDED.points,
        position = EXCLUDED.position,
        wins = EXCLUDED.wins
    `;
  }
}

async function insertConstructorStandings(raceId, standings) {
  if (!standings) return;
  for (const s of standings) {
    await sql`
      INSERT INTO constructor_standings (
        race_id, constructor_id, points, position, wins
      ) VALUES (
        ${raceId}, ${s.Constructor?.constructorId}, ${Number(s.points || 0)}, ${Number(s.position || 0)}, ${Number(s.wins || 0)}
      )
      ON CONFLICT (race_id, constructor_id) DO UPDATE SET
        points = EXCLUDED.points,
        position = EXCLUDED.position,
        wins = EXCLUDED.wins
    `;
  }
}

async function insertLapTimes(raceId, laps) {
  if (!laps) return;
  for (const lap of laps) {
    for (const timing of lap.Timings || []) {
      await sql`
        INSERT INTO lap_times (
          race_id, driver_id, lap, position, time
        ) VALUES (
          ${raceId}, ${timing.driverId}, ${Number(lap.number || 0)}, ${Number(timing.position || 0)}, ${timing.time || null}
        )
        ON CONFLICT DO NOTHING
      `;
    }
  }
}

async function insertPitStops(raceId, pitStops) {
  if (!pitStops) return;
  for (const stop of pitStops) {
    await sql`
      INSERT INTO pit_stops (
        race_id, driver_id, stop, lap, time, duration
      ) VALUES (
        ${raceId}, ${stop.driverId}, ${Number(stop.stop || 0)}, ${Number(stop.lap || 0)}, ${stop.time || null}, ${stop.duration || null}
      )
      ON CONFLICT DO NOTHING
    `;
  }
}

async function seedYear(year) {
  console.log(`\n=== Year ${year} ===`);
  const base = 'https://api.jolpi.ca/ergast/f1';

  const seasonId = await getOrCreateSeasonId(year);

  // Fetch schedule which includes races and circuits
  const scheduleData = await fetchJSON(`${base}/${year}`);
  const races = scheduleData?.RaceTable?.Races || [];

  // Upsert races and circuits
  for (const race of races) {
    await upsertRace(seasonId, race);
  }

  // Fetch and upsert drivers
  const driversData = await fetchJSON(`${base}/${year}/drivers`);
  for (const d of driversData?.DriverTable?.Drivers || []) {
    await upsertDriver(d);
  }

  // Fetch and upsert constructors
  const constructorsData = await fetchJSON(`${base}/${year}/constructors`);
  for (const c of constructorsData?.ConstructorTable?.Constructors || []) {
    await upsertConstructor(c);
  }

  // For each race/round, fetch results, qualifying, sprint
  for (const race of races) {
    const round = race.round;
    const raceId = await getRaceId(seasonId, round);
    if (!raceId) continue;

    console.log(`  - Round ${round}: ${race.raceName}`);

    // Results
    try {
      const resData = await fetchJSON(`${base}/${year}/${round}/results`);
      const r = resData?.RaceTable?.Races?.[0];
      if (r?.Results) await insertRaceResults(raceId, r.Results);
    } catch (e) {
      // Ignore missing results
    }

    // Qualifying
    try {
      const qData = await fetchJSON(`${base}/${year}/${round}/qualifying`);
      const q = qData?.RaceTable?.Races?.[0];
      if (q?.QualifyingResults) await insertQualifyingResults(raceId, q.QualifyingResults);
    } catch (e) {}

    // Sprint (only for sprint weekends)
    try {
      const sData = await fetchJSON(`${base}/${year}/${round}/sprint`);
      const s = sData?.RaceTable?.Races?.[0];
      if (s?.SprintResults) await insertSprintResults(raceId, s.SprintResults);
    } catch (e) {}

    // Driver standings
    try {
      const dsData = await fetchJSON(`${base}/${year}/${round}/driverstandings`);
      const ds = dsData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings;
      if (ds) await insertDriverStandings(raceId, ds);
    } catch (e) {}

    // Constructor standings
    try {
      const csData = await fetchJSON(`${base}/${year}/${round}/constructorstandings`);
      const cs = csData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings;
      if (cs) await insertConstructorStandings(raceId, cs);
    } catch (e) {}

    // Lap times (limited)
    try {
      const lData = await fetchJSON(`${base}/${year}/${round}/laps?limit=2000`);
      const l = lData?.RaceTable?.Races?.[0]?.Laps;
      if (l) await insertLapTimes(raceId, l);
    } catch (e) {}

    // Pit stops
    try {
      const pData = await fetchJSON(`${base}/${year}/${round}/pitstops`);
      const p = pData?.RaceTable?.Races?.[0]?.PitStops;
      if (p) await insertPitStops(raceId, p);
    } catch (e) {}

    // Small delay to be gentle
    await delay(150);
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    let start = 1950;
    let end = 2025; // current upper bound
    if (args.length === 1) {
      const yr = Number(args[0]);
      if (!Number.isNaN(yr)) {
        start = yr; end = yr;
      }
    } else if (args.length >= 2) {
      const s = Number(args[0]);
      const e = Number(args[1]);
      if (!Number.isNaN(s)) start = s;
      if (!Number.isNaN(e)) end = e;
    }
    for (let y = start; y <= end; y++) {
      await seedYear(y);
      // Extra delay between years
      await delay(500);
    }
    console.log('\n✅ Seeding completed');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exitCode = 1;
  }
}

main();
