import sqlite3 from 'sqlite3';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'sqlite.db');
const ERGAST_BASE_URL = 'http://ergast.com/api/f1';
const SEASON = '2024';

// Create database connection
const db = new sqlite3.Database(DB_PATH);

// Helper function to make API requests with rate limiting
const fetchWithDelay = async (url) => {
    try {
        console.log(`🌐 Fetching data from: ${url}`);
        const response = await axios.get(`${url}.json`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
        console.log(`✅ Successfully fetched data from: ${url}`);
        return response.data.MRData;
    } catch (error) {
        console.error(`❌ Error fetching ${url}:`, error.message);
        return null;
    }
};

// Initialize database
const initializeDatabase = async () => {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    return new Promise((resolve, reject) => {
        db.exec(schema, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Fetch and store season data
const fetchSeasonData = async () => {
    console.log(`\n📅 Fetching season data for ${SEASON}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${SEASON}`);
    if (!data) return;

    const stmt = db.prepare('INSERT OR REPLACE INTO seasons (year, url) VALUES (?, ?)');
    stmt.run(SEASON, `http://ergast.com/api/f1/${SEASON}`);
    stmt.finalize();
    console.log(`✅ Season data stored successfully`);
};

// Fetch and store race schedule
const fetchRaceSchedule = async () => {
    console.log(`\n🏁 Fetching race schedule for ${SEASON}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${SEASON}`);
    if (!data?.RaceTable?.Races) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO races (season_id, round, name, date, time, url)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    data.RaceTable.Races.forEach(race => {
        console.log(`📍 Processing race: ${race.raceName}`);
        stmt.run(
            SEASON,
            race.round,
            race.raceName,
            race.date,
            race.time,
            race.url
        );
    });

    stmt.finalize();
    console.log(`✅ Race schedule stored successfully`);
};

// Fetch and store circuits
const fetchCircuits = async () => {
    console.log(`\n🏎 Fetching circuits for ${SEASON}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${SEASON}/circuits`);
    if (!data?.CircuitTable?.Circuits) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO circuits (circuit_id, name, location, country, lat, lng, url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    data.CircuitTable.Circuits.forEach(circuit => {
        console.log(`🏁 Processing circuit: ${circuit.circuitName}`);
        stmt.run(
            circuit.circuitId,
            circuit.circuitName,
            circuit.Location.locality,
            circuit.Location.country,
            circuit.Location.lat,
            circuit.Location.long,
            circuit.url
        );
    });

    stmt.finalize();
    console.log(`✅ Circuits data stored successfully`);
};

// Fetch and store drivers
const fetchDrivers = async () => {
    console.log(`\n👨‍🏎 Fetching drivers for ${SEASON}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${SEASON}/drivers`);
    if (!data?.DriverTable?.Drivers) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO drivers (driver_id, code, number, forename, surname, dob, nationality, url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    data.DriverTable.Drivers.forEach(driver => {
        console.log(`🏎 Processing driver: ${driver.givenName} ${driver.familyName}`);
        stmt.run(
            driver.driverId,
            driver.code,
            driver.permanentNumber,
            driver.givenName,
            driver.familyName,
            driver.dateOfBirth,
            driver.nationality,
            driver.url
        );
    });

    stmt.finalize();
    console.log(`✅ Drivers data stored successfully`);
};

// Fetch and store constructors
const fetchConstructors = async () => {
    console.log(`\n🏭 Fetching constructors for ${SEASON}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${SEASON}/constructors`);
    if (!data?.ConstructorTable?.Constructors) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO constructors (constructor_id, name, nationality, url)
        VALUES (?, ?, ?, ?)
    `);

    data.ConstructorTable.Constructors.forEach(constructor => {
        console.log(`🏢 Processing constructor: ${constructor.name}`);
        stmt.run(
            constructor.constructorId,
            constructor.name,
            constructor.nationality,
            constructor.url
        );
    });

    stmt.finalize();
    console.log(`✅ Constructors data stored successfully`);
};

// Fetch and store race results after each race
const fetchRaceResults = async (round) => {
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${SEASON}/${round}/results`);
    if (!data?.RaceTable?.Races?.[0]?.Results) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO race_results 
        (race_id, driver_id, constructor_id, grid, position, points, laps, status, time, fastest_lap, fastest_lap_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    data.RaceTable.Races[0].Results.forEach(result => {
        stmt.run(
            data.RaceTable.Races[0].round,
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
        );
    });

    stmt.finalize();
};

// Fetch and store qualifying results for each race
const fetchQualifyingResults = async (round) => {
    console.log(`\n⏱ Fetching qualifying results for round ${round}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${SEASON}/${round}/qualifying`);
    if (!data?.RaceTable?.Races?.[0]?.QualifyingResults) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO qualifying_results (race_id, driver_id, constructor_id, position, q1_time, q2_time, q3_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    data.RaceTable.Races[0].QualifyingResults.forEach(result => {
        console.log(`🏁 Processing qualifying result for: ${result.Driver.familyName}`);
        stmt.run(
            round,
            result.Driver.driverId,
            result.Constructor.constructorId,
            result.position,
            result.Q1 || null,
            result.Q2 || null,
            result.Q3 || null
        );
    });

    stmt.finalize();
    console.log(`✅ Qualifying results stored successfully for round ${round}`);
};

// Fetch and store driver standings after each race
const fetchDriverStandings = async (round) => {
    console.log(`\n📊 Fetching driver standings after round ${round}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${SEASON}/${round}/driverStandings`);
    if (!data?.StandingsTable?.StandingsLists?.[0]?.DriverStandings) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO driver_standings (race_id, driver_id, points, position, wins)
        VALUES (?, ?, ?, ?, ?)
    `);

    data.StandingsTable.StandingsLists[0].DriverStandings.forEach(standing => {
        console.log(`📈 Processing driver standing for: ${standing.Driver.familyName}`);
        stmt.run(
            round,
            standing.Driver.driverId,
            standing.points,
            standing.position,
            standing.wins
        );
    });

    stmt.finalize();
    console.log(`✅ Driver standings stored successfully for round ${round}`);
};

// Fetch and store constructor standings after each race
const fetchConstructorStandings = async (round) => {
    console.log(`\n🏆 Fetching constructor standings after round ${round}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${SEASON}/${round}/constructorStandings`);
    if (!data?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO constructor_standings (race_id, constructor_id, points, position, wins)
        VALUES (?, ?, ?, ?, ?)
    `);

    data.StandingsTable.StandingsLists[0].ConstructorStandings.forEach(standing => {
        console.log(`📊 Processing constructor standing for: ${standing.Constructor.name}`);
        stmt.run(
            round,
            standing.Constructor.constructorId,
            standing.points,
            standing.position,
            standing.wins
        );
    });

    stmt.finalize();
    console.log(`✅ Constructor standings stored successfully for round ${round}`);
};

// Fetch and store lap times for each race
const fetchLapTimes = async (round) => {
    console.log(`\n⏱ Fetching lap times for round ${round}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${SEASON}/${round}/laps`);
    if (!data?.RaceTable?.Races?.[0]?.Laps) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO lap_times (race_id, driver_id, lap, position, time)
        VALUES (?, ?, ?, ?, ?)
    `);

    data.RaceTable.Races[0].Laps.forEach(lap => {
        lap.Timings.forEach(timing => {
            console.log(`⏱ Processing lap ${lap.number} for driver: ${timing.driverId}`);
            stmt.run(
                round,
                timing.driverId,
                lap.number,
                timing.position,
                timing.time
            );
        });
    });

    stmt.finalize();
    console.log(`✅ Lap times stored successfully for round ${round}`);
};

// Fetch and store pit stops for each race
const fetchPitStops = async (round) => {
    console.log(`\n🔧 Fetching pit stops for round ${round}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${SEASON}/${round}/pitstops`);
    if (!data?.RaceTable?.Races?.[0]?.PitStops) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO pit_stops (race_id, driver_id, stop, lap, time, duration)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    data.RaceTable.Races[0].PitStops.forEach(stop => {
        console.log(`🔧 Processing pit stop ${stop.stop} for driver: ${stop.driverId}`);
        stmt.run(
            round,
            stop.driverId,
            stop.stop,
            stop.lap,
            stop.time,
            stop.duration
        );
    });

    stmt.finalize();
    console.log(`✅ Pit stops stored successfully for round ${round}`);
};

// Fetch race-specific data for each round
const fetchRaceData = async (round) => {
    console.log(`\n🏁 Fetching all data for round ${round}...`);
    await fetchRaceResults(round);
    await fetchQualifyingResults(round);
    await fetchDriverStandings(round);
    await fetchConstructorStandings(round);
    await fetchLapTimes(round);
    await fetchPitStops(round);
    console.log(`✅ Completed data collection for round ${round}`);
};

// Main function to orchestrate data fetching
const fetchAllData = async () => {
    try {
        console.log('🚀 Starting F1 data extraction process...');
        console.log('📊 Target Season:', SEASON);
        console.log('💾 Database Path:', DB_PATH);
        console.log('\n🔧 Initializing database...');
        await initializeDatabase();

        console.log('\n📥 Starting data extraction...');
        
        // Fetch season-level data
        await fetchSeasonData();
        await fetchRaceSchedule();
        await fetchCircuits();
        await fetchDrivers();
        await fetchConstructors();

        // Fetch race-specific data for each round
        const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${SEASON}`);
        if (data?.RaceTable?.Races) {
            for (const race of data.RaceTable.Races) {
                console.log(`\n🏎 Processing race ${race.round}: ${race.raceName}`);
                await fetchRaceData(race.round);
            }
        }

        console.log('\n🎉 Data fetching completed successfully!');
        console.log('✨ Database has been populated with F1 data');
    } catch (error) {
        console.error('❌ Error during data fetching:', error);
    } finally {
        console.log('\n👋 Closing database connection...');
        db.close();
    }
};

// Execute the main function
fetchAllData();
