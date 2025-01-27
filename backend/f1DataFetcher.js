import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'sqlite.db');
const ERGAST_BASE_URL = 'http://ergast.com/api/f1';
const YEARS = ['2020', '2021', '2022', '2023', '2024'];

// Create database connection
const db = new sqlite3.Database(DB_PATH);

// Helper function to fetch data with delay
const fetchWithDelay = async (url) => {
    try {
        const response = await fetch(url + '.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
        return data.MRData;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        return null;
    }
};

// Initialize database
const initializeDatabase = async () => {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    return new Promise((resolve, reject) => {
        db.exec(schema, (err) => {
            if (err) {
                console.error('Error initializing database:', err);
                reject(err);
            } else {
                console.log('✅ Database initialized successfully');
                resolve();
            }
        });
    });
};

// Fetch and store season data
const fetchSeasonData = async () => {
    for (const year of YEARS) {
        console.log(`\n📅 Fetching season data for ${year}...`);
        const url = `${ERGAST_BASE_URL}/${year}`;
        const data = await fetchWithDelay(url);
        if (!data) continue;

        const stmt = db.prepare('INSERT OR REPLACE INTO seasons (year, url) VALUES (?, ?)');
        stmt.run(year, `${ERGAST_BASE_URL}/${year}`);
        stmt.finalize();
        console.log(`✅ Season data stored for ${year}`);
    }
};

// Fetch and store race schedule
const fetchRaceSchedule = async () => {
    for (const year of YEARS) {
        console.log(`\n🏁 Fetching race schedule for ${year}...`);
        const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${year}`);
        if (!data?.RaceTable?.Races) continue;

        const seasonId = await new Promise(resolve => {
            db.get('SELECT season_id FROM seasons WHERE year = ?', [year], (err, row) => {
                resolve(row ? row.season_id : null);
            });
        });

        if (!seasonId) continue;

        const stmt = db.prepare(`
            INSERT OR REPLACE INTO races (season_id, round, name, date, time, url)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        data.RaceTable.Races.forEach(race => {
            console.log(`📍 Processing race: ${race.raceName}`);
            stmt.run(
                seasonId,
                race.round,
                race.raceName,
                race.date,
                race.time,
                race.url
            );
        });

        stmt.finalize();
        console.log(`✅ Race schedule stored for ${year}`);
    }
};

// Fetch and store circuits
const fetchCircuits = async () => {
    for (const year of YEARS) {
        console.log(`\n🏎 Fetching circuits for ${year}...`);
        const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${year}/circuits`);
        if (!data?.CircuitTable?.Circuits) continue;

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
        console.log(`✅ Circuits data stored for ${year}`);
    }
};

// Fetch and store drivers
const fetchDrivers = async () => {
    for (const year of YEARS) {
        console.log(`\n👨‍🏎 Fetching drivers for ${year}...`);
        const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${year}/drivers`);
        if (!data?.DriverTable?.Drivers) continue;

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
        console.log(`✅ Drivers data stored for ${year}`);
    }
};

// Fetch and store constructors
const fetchConstructors = async () => {
    for (const year of YEARS) {
        console.log(`\n🏭 Fetching constructors for ${year}...`);
        const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${year}/constructors`);
        if (!data?.ConstructorTable?.Constructors) continue;

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
        console.log(`✅ Constructors data stored for ${year}`);
    }
};

// Fetch and store race results
const fetchRaceResults = async (year, round) => {
    console.log(`\n🏁 Fetching race results for ${year} round ${round}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${year}/${round}/results`);
    if (!data?.RaceTable?.Races?.[0]?.Results) return;

    const race = data.RaceTable.Races[0];
    const raceId = await new Promise(resolve => {
        db.get(
            'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
            [year, round],
            (err, row) => resolve(row ? row.race_id : null)
        );
    });

    if (!raceId) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO race_results 
        (race_id, driver_id, constructor_id, grid, position, points, laps, status, time, fastest_lap, fastest_lap_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    race.Results.forEach(result => {
        stmt.run(
            raceId,
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
    console.log(`✅ Race results stored for ${year} round ${round}`);
};

// Fetch and store qualifying results
const fetchQualifyingResults = async (year, round) => {
    console.log(`\n⏱ Fetching qualifying results for ${year} round ${round}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${year}/${round}/qualifying`);
    if (!data?.RaceTable?.Races?.[0]?.QualifyingResults) return;

    const race = data.RaceTable.Races[0];
    const raceId = await new Promise(resolve => {
        db.get(
            'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
            [year, round],
            (err, row) => resolve(row ? row.race_id : null)
        );
    });

    if (!raceId) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO qualifying_results 
        (race_id, driver_id, constructor_id, position, q1_time, q2_time, q3_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    race.QualifyingResults.forEach(result => {
        stmt.run(
            raceId,
            result.Driver.driverId,
            result.Constructor.constructorId,
            result.position,
            result.Q1,
            result.Q2,
            result.Q3
        );
    });

    stmt.finalize();
    console.log(`✅ Qualifying results stored for ${year} round ${round}`);
};

// Fetch and store sprint results
const fetchSprintResults = async (year, round) => {
    console.log(`\n🏃 Fetching sprint results for ${year} round ${round}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${year}/${round}/sprint`);
    if (!data?.RaceTable?.Races?.[0]?.SprintResults) return;

    const race = data.RaceTable.Races[0];
    const raceId = await new Promise(resolve => {
        db.get(
            'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
            [year, round],
            (err, row) => resolve(row ? row.race_id : null)
        );
    });

    if (!raceId) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO sprint_results 
        (race_id, driver_id, constructor_id, position, grid, points, laps, status, time, fastest_lap, fastest_lap_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    race.SprintResults.forEach(result => {
        stmt.run(
            raceId,
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
        );
    });

    stmt.finalize();
    console.log(`✅ Sprint results stored for ${year} round ${round}`);
};

// Fetch and store driver standings
const fetchDriverStandings = async (year, round) => {
    console.log(`\n📊 Fetching driver standings for ${year} round ${round}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${year}/${round}/driverStandings`);
    if (!data?.StandingsTable?.StandingsLists?.[0]?.DriverStandings) return;

    const raceId = await new Promise(resolve => {
        db.get(
            'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
            [year, round],
            (err, row) => resolve(row ? row.race_id : null)
        );
    });

    if (!raceId) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO driver_standings 
        (race_id, driver_id, points, position, wins)
        VALUES (?, ?, ?, ?, ?)
    `);

    data.StandingsTable.StandingsLists[0].DriverStandings.forEach(standing => {
        stmt.run(
            raceId,
            standing.Driver.driverId,
            standing.points,
            standing.position,
            standing.wins
        );
    });

    stmt.finalize();
    console.log(`✅ Driver standings stored for ${year} round ${round}`);
};

// Fetch and store constructor standings
const fetchConstructorStandings = async (year, round) => {
    console.log(`\n🏆 Fetching constructor standings for ${year} round ${round}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${year}/${round}/constructorStandings`);
    if (!data?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings) return;

    const raceId = await new Promise(resolve => {
        db.get(
            'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
            [year, round],
            (err, row) => resolve(row ? row.race_id : null)
        );
    });

    if (!raceId) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO constructor_standings 
        (race_id, constructor_id, points, position, wins)
        VALUES (?, ?, ?, ?, ?)
    `);

    data.StandingsTable.StandingsLists[0].ConstructorStandings.forEach(standing => {
        stmt.run(
            raceId,
            standing.Constructor.constructorId,
            standing.points,
            standing.position,
            standing.wins
        );
    });

    stmt.finalize();
    console.log(`✅ Constructor standings stored for ${year} round ${round}`);
};

// Fetch and store lap times
const fetchLapTimes = async (year, round) => {
    console.log(`\n⏱ Fetching lap times for ${year} round ${round}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${year}/${round}/laps`);
    if (!data?.RaceTable?.Races?.[0]?.Laps) return;

    const raceId = await new Promise(resolve => {
        db.get(
            'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
            [year, round],
            (err, row) => resolve(row ? row.race_id : null)
        );
    });

    if (!raceId) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO lap_times 
        (race_id, driver_id, lap, position, time)
        VALUES (?, ?, ?, ?, ?)
    `);

    data.RaceTable.Races[0].Laps.forEach(lap => {
        lap.Timings.forEach(timing => {
            stmt.run(
                raceId,
                timing.driverId,
                lap.number,
                timing.position,
                timing.time
            );
        });
    });

    stmt.finalize();
    console.log(`✅ Lap times stored for ${year} round ${round}`);
};

// Fetch and store pit stops
const fetchPitStops = async (year, round) => {
    console.log(`\n🔧 Fetching pit stops for ${year} round ${round}...`);
    const data = await fetchWithDelay(`${ERGAST_BASE_URL}/${year}/${round}/pitstops`);
    if (!data?.RaceTable?.Races?.[0]?.PitStops) return;

    const raceId = await new Promise(resolve => {
        db.get(
            'SELECT race_id FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) AND round = ?',
            [year, round],
            (err, row) => resolve(row ? row.race_id : null)
        );
    });

    if (!raceId) return;

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO pit_stops 
        (race_id, driver_id, stop, lap, time, duration)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    data.RaceTable.Races[0].PitStops.forEach(stop => {
        stmt.run(
            raceId,
            stop.driverId,
            stop.stop,
            stop.lap,
            stop.time,
            stop.duration
        );
    });

    stmt.finalize();
    console.log(`✅ Pit stops stored for ${year} round ${round}`);
};

// Main function to orchestrate data fetching
const main = async () => {
    try {
        console.log('🚀 Starting F1 data extraction process...');
        console.log('📊 Target Years:', YEARS);
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

        // Fetch race-specific data for each year and round
        for (const year of YEARS) {
            const races = await new Promise(resolve => {
                db.all(
                    'SELECT round FROM races WHERE season_id = (SELECT season_id FROM seasons WHERE year = ?) ORDER BY round',
                    [year],
                    (err, rows) => resolve(rows || [])
                );
            });

            for (const race of races) {
                console.log(`\n🏎 Processing ${year} round ${race.round}...`);
                await fetchRaceResults(year, race.round);
                await fetchQualifyingResults(year, race.round);
                await fetchSprintResults(year, race.round);
                await fetchDriverStandings(year, race.round);
                await fetchConstructorStandings(year, race.round);
                await fetchLapTimes(year, race.round);
                await fetchPitStops(year, race.round);
                // Add a small delay between rounds to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
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
main();
