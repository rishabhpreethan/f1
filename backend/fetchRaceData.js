import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ERGAST_BASE_URL = 'https://ergast.com/api/f1';
const DB_PATH = path.join(__dirname, 'sqlite.db');

// Helper function to add delay between API calls
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Initialize database
async function initializeDatabase() {
    // Ensure the database file exists
    try {
        await fs.access(DB_PATH);
    } catch {
        console.log('Creating new database file...');
        await fs.writeFile(DB_PATH, '');
    }

    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    // Load and execute schema
    const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.exec(schema);
    console.log('✅ Database initialized with schema');

    return db;
}

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Fetching data from: ${url}`);
            const response = await axios.get(url);
            console.log(`Successfully fetched data from: ${url}`);
            return response.data.MRData;
        } catch (error) {
            console.error(`Attempt ${i + 1}/${retries} failed for ${url}:`, error.message);
            if (i === retries - 1) throw error;
            console.log(`Retrying in ${(i + 1)} seconds...`);
            await delay(1000 * (i + 1)); // Exponential backoff
        }
    }
}

async function fetchRaceResults(db, year, round) {
    console.log(`\nFetching race results for ${year} round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${year}/${round}/results.json`;
    const data = await fetchWithRetry(url);
    if (!data?.RaceTable?.Races?.[0]) return null;
    return data.RaceTable.Races[0];
}

async function fetchQualifyingResults(db, year, round) {
    console.log(`Fetching qualifying results for ${year} round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${year}/${round}/qualifying.json`;
    const data = await fetchWithRetry(url);
    if (!data?.RaceTable?.Races?.[0]) return null;
    return data.RaceTable.Races[0];
}

async function fetchSprintResults(db, year, round) {
    console.log(`Fetching sprint results for ${year} round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${year}/${round}/sprint.json`;
    const data = await fetchWithRetry(url);
    if (!data?.RaceTable?.Races?.[0]) return null;
    return data.RaceTable.Races[0];
}

async function fetchLapTimes(db, year, round) {
    console.log(`Fetching lap times for ${year} round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${year}/${round}/laps.json?limit=2000`;
    const data = await fetchWithRetry(url);
    if (!data?.RaceTable?.Races?.[0]) return null;
    return data.RaceTable.Races[0];
}

async function fetchPitStops(db, year, round) {
    console.log(`Fetching pit stops for ${year} round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${year}/${round}/pitstops.json`;
    const data = await fetchWithRetry(url);
    if (!data?.RaceTable?.Races?.[0]) return null;
    return data.RaceTable.Races[0];
}

async function fetchDriverStandings(db, year, round) {
    console.log(`Fetching driver standings for ${year} round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${year}/${round}/driverStandings.json`;
    const data = await fetchWithRetry(url);
    if (!data?.StandingsTable?.StandingsLists?.[0]) return null;
    return data.StandingsTable.StandingsLists[0];
}

async function fetchConstructorStandings(db, year, round) {
    console.log(`Fetching constructor standings for ${year} round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${year}/${round}/constructorStandings.json`;
    const data = await fetchWithRetry(url);
    if (!data?.StandingsTable?.StandingsLists?.[0]) return null;
    return data.StandingsTable.StandingsLists[0];
}

async function saveRaceResults(db, year, round, raceResults) {
    if (!raceResults?.Results) return;

    const raceId = await db.get(
        'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
        [year, round]
    );
    if (!raceId) return;

    for (const result of raceResults.Results) {
        await db.run(`
            INSERT OR REPLACE INTO race_results (
                race_id, driver_id, constructor_id, grid, position,
                points, laps, status, time, fastest_lap, fastest_lap_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            raceId.race_id,
            result.Driver.driverId,
            result.Constructor.constructorId,
            result.grid,
            result.position,
            result.points,
            result.laps,
            result.status,
            result.Time?.time,
            result.FastestLap?.lap,
            result.FastestLap?.Time?.time
        ]);
    }
}

async function saveQualifyingResults(db, year, round, qualifyingResults) {
    if (!qualifyingResults?.QualifyingResults) return;

    const raceId = await db.get(
        'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
        [year, round]
    );
    if (!raceId) return;

    for (const result of qualifyingResults.QualifyingResults) {
        await db.run(`
            INSERT OR REPLACE INTO qualifying_results (
                race_id, driver_id, constructor_id, position,
                q1_time, q2_time, q3_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            raceId.race_id,
            result.Driver.driverId,
            result.Constructor.constructorId,
            result.position,
            result.Q1,
            result.Q2,
            result.Q3
        ]);
    }
}

async function saveSprintResults(db, year, round, sprintResults) {
    if (!sprintResults?.SprintResults) return;

    const raceId = await db.get(
        'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
        [year, round]
    );
    if (!raceId) return;

    for (const result of sprintResults.SprintResults) {
        await db.run(`
            INSERT OR REPLACE INTO sprint_results (
                race_id, driver_id, constructor_id, position, grid,
                points, laps, status, time, fastest_lap, fastest_lap_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            raceId.race_id,
            result.Driver.driverId,
            result.Constructor.constructorId,
            result.position,
            result.grid,
            result.points,
            result.laps,
            result.status,
            result.Time?.time,
            result.FastestLap?.lap,
            result.FastestLap?.Time?.time
        ]);
    }
}

async function saveLapTimes(db, year, round, lapTimes) {
    if (!lapTimes?.Laps) return;

    const raceId = await db.get(
        'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
        [year, round]
    );
    if (!raceId) return;

    for (const lap of lapTimes.Laps) {
        for (const timing of lap.Timings) {
            await db.run(`
                INSERT OR REPLACE INTO lap_times (
                    race_id, driver_id, lap, position, time
                ) VALUES (?, ?, ?, ?, ?)
            `, [
                raceId.race_id,
                timing.driverId,
                lap.number,
                timing.position,
                timing.time
            ]);
        }
    }
}

async function savePitStops(db, year, round, pitStops) {
    if (!pitStops?.PitStops) return;

    const raceId = await db.get(
        'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
        [year, round]
    );
    if (!raceId) return;

    for (const stop of pitStops.PitStops) {
        await db.run(`
            INSERT OR REPLACE INTO pit_stops (
                race_id, driver_id, stop, lap, time, duration
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            raceId.race_id,
            stop.driverId,
            stop.stop,
            stop.lap,
            stop.time,
            stop.duration
        ]);
    }
}

async function saveDriverStandings(db, year, round, driverStandings) {
    if (!driverStandings?.DriverStandings) return;

    const raceId = await db.get(
        'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
        [year, round]
    );
    if (!raceId) return;

    for (const standing of driverStandings.DriverStandings) {
        await db.run(`
            INSERT OR REPLACE INTO driver_standings (
                race_id, driver_id, points, position, wins
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            raceId.race_id,
            standing.Driver.driverId,
            standing.points,
            standing.position,
            standing.wins
        ]);
    }
}

async function saveConstructorStandings(db, year, round, constructorStandings) {
    if (!constructorStandings?.ConstructorStandings) return;

    const raceId = await db.get(
        'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
        [year, round]
    );
    if (!raceId) return;

    for (const standing of constructorStandings.ConstructorStandings) {
        await db.run(`
            INSERT OR REPLACE INTO constructor_standings (
                race_id, constructor_id, points, position, wins
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            raceId.race_id,
            standing.Constructor.constructorId,
            standing.points,
            standing.position,
            standing.wins
        ]);
    }
}

async function generateRaceAnalytics(year, round) {
    console.log(`\nGenerating analytics for ${year} round ${round}...`);
    
    const db = await initializeDatabase();
    
    try {
        // Fetch all race data
        const raceResults = await fetchRaceResults(db, year, round);
        if (!raceResults) {
            console.log('No race results found for this round');
            return;
        }

        const qualifyingResults = await fetchQualifyingResults(db, year, round);
        const sprintResults = await fetchSprintResults(db, year, round);
        const lapTimes = await fetchLapTimes(db, year, round);
        const pitStops = await fetchPitStops(db, year, round);
        const driverStandings = await fetchDriverStandings(db, year, round);
        const constructorStandings = await fetchConstructorStandings(db, year, round);

        // Save all data to database
        await saveRaceResults(db, year, round, raceResults);
        await saveQualifyingResults(db, year, round, qualifyingResults);
        await saveSprintResults(db, year, round, sprintResults);
        await saveLapTimes(db, year, round, lapTimes);
        await savePitStops(db, year, round, pitStops);
        await saveDriverStandings(db, year, round, driverStandings);
        await saveConstructorStandings(db, year, round, constructorStandings);

        console.log('✅ Race analytics generated and saved successfully');
    } catch (error) {
        console.error('Error generating race analytics:', error);
        throw error;
    } finally {
        await db.close();
    }
}

// Function to generate data for a specific year
async function generateYearData(year) {
    console.log(`\n🏁 Generating F1 data for ${year}...`);
    
    try {
        // Get all rounds for the year
        const db = await initializeDatabase();
        const rounds = await db.all(
            'SELECT round FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) ORDER BY round',
            [year]
        );
        await db.close();

        // Process each round
        for (const { round } of rounds) {
            console.log(`\n📊 Processing round ${round}...`);
            await generateRaceAnalytics(year, round);
            // Add delay between rounds to avoid rate limiting
            await delay(1000);
        }

        console.log(`\n✅ Data generation completed for ${year}`);
    } catch (error) {
        console.error(`Error generating data for ${year}:`, error);
        throw error;
    }
}

export { generateYearData, generateRaceAnalytics };
