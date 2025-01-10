import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const ERGAST_BASE_URL = 'https://ergast.com/api/f1';
const YEAR = 2024;

// Helper function to add delay between API calls
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Fetching data from: ${url}`);
            const response = await axios.get(url);
            console.log(`Successfully fetched data from: ${url}`);
            return response.data;
        } catch (error) {
            console.error(`Attempt ${i + 1}/${retries} failed for ${url}:`, error.message);
            if (i === retries - 1) throw error;
            console.log(`Retrying in ${(i + 1)} seconds...`);
            await delay(1000 * (i + 1)); // Exponential backoff
        }
    }
}

async function fetchRaceResults(round) {
    console.log(`\nFetching race results for round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${YEAR}/${round}/results.json`;
    const data = await fetchWithRetry(url);
    console.log(`✓ Race results retrieved for round ${round}`);
    return data.MRData.RaceTable.Races[0];
}

async function fetchQualifyingResults(round) {
    console.log(`Fetching qualifying results for round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${YEAR}/${round}/qualifying.json`;
    const data = await fetchWithRetry(url);
    console.log(`✓ Qualifying results retrieved for round ${round}`);
    return data.MRData.RaceTable.Races[0];
}

async function fetchLapTimes(round) {
    console.log(`Fetching lap times for round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${YEAR}/${round}/laps.json?limit=2000`;
    const data = await fetchWithRetry(url);
    console.log(`✓ Lap times retrieved for round ${round}`);
    return data.MRData.RaceTable.Races[0];
}

async function fetchPitStops(round) {
    console.log(`Fetching pit stops for round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${YEAR}/${round}/pitstops.json`;
    const data = await fetchWithRetry(url);
    console.log(`✓ Pit stops retrieved for round ${round}`);
    return data.MRData.RaceTable.Races[0];
}

async function fetchDriverStandings(round) {
    console.log(`Fetching driver standings for round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${YEAR}/${round}/driverStandings.json`;
    const data = await fetchWithRetry(url);
    console.log(`✓ Driver standings retrieved for round ${round}`);
    return data.MRData.StandingsTable.StandingsLists[0];
}

async function fetchConstructorStandings(round) {
    console.log(`Fetching constructor standings for round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${YEAR}/${round}/constructorStandings.json`;
    const data = await fetchWithRetry(url);
    console.log(`✓ Constructor standings retrieved for round ${round}`);
    return data.MRData.StandingsTable.StandingsLists[0];
}

async function fetchSprintResults(round) {
    console.log(`Fetching sprint results for round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${YEAR}/${round}/sprint.json`;
    const data = await fetchWithRetry(url);
    console.log(`✓ Sprint results retrieved for round ${round}`);
    return data.MRData.RaceTable.Races[0];
}

async function fetchCircuitDetails(round) {
    console.log(`Fetching circuit details for round ${round}...`);
    const url = `${ERGAST_BASE_URL}/${YEAR}/${round}/circuits.json`;
    const data = await fetchWithRetry(url);
    console.log(`✓ Circuit details retrieved for round ${round}`);
    return data.MRData.CircuitTable.Circuits[0];
}

async function calculateDriverPerformance(raceResults, qualifyingResults, lapTimes) {
    console.log('\nCalculating driver performance metrics...');
    const performances = {};
    
    for (const result of raceResults.Results) {
        const driverId = result.Driver.driverId;
        console.log(`\nProcessing driver: ${result.Driver.givenName} ${result.Driver.familyName}`);
        
        const qualifyingResult = qualifyingResults.QualifyingResults.find(
            q => q.Driver.driverId === driverId
        );
        
        // Calculate consistency score based on lap times
        const driverLaps = lapTimes.Laps ? lapTimes.Laps.map(lap => 
            lap.Timings.find(t => t.driverId === driverId)
        ).filter(Boolean) : [];
        
        console.log(`Found ${driverLaps.length} valid laps for analysis`);
        
        let consistencyScore = 5; // Default to middle score if no lap times
        let avgLapTime = 0;
        
        if (driverLaps.length > 0) {
            const lapTimeSeconds = driverLaps.map(lap => {
                const [minutes, seconds] = lap.time.split(':');
                return parseInt(minutes) * 60 + parseFloat(seconds);
            });
            
            avgLapTime = lapTimeSeconds.reduce((a, b) => a + b, 0) / lapTimeSeconds.length;
            const lapTimeVariance = lapTimeSeconds.reduce((acc, time) => 
                acc + Math.pow(time - avgLapTime, 2), 0) / lapTimeSeconds.length;
            
            // Score from 1-10 based on variance (lower variance = higher score)
            consistencyScore = 10 - (Math.sqrt(lapTimeVariance) * 2);
        }
        
        const tyreManagementScore = calculateTyreManagement(result, lapTimes) || 5;
        const overtakingScore = calculateOvertakingScore(result) || 5;
        const defenseScore = calculateDefenseScore(result) || 5;
        const weekendRating = calculateWeekendRating(result, qualifyingResult) || 5;
        
        console.log('Performance metrics calculated:');
        console.log(`- Consistency: ${consistencyScore.toFixed(2)}`);
        console.log(`- Tyre Management: ${tyreManagementScore.toFixed(2)}`);
        console.log(`- Overtaking: ${overtakingScore.toFixed(2)}`);
        console.log(`- Defense: ${defenseScore.toFixed(2)}`);
        console.log(`- Weekend Rating: ${weekendRating.toFixed(2)}`);
        
        performances[driverId] = {
            points: parseInt(result.points),
            gridPosition: parseInt(result.grid),
            finishPosition: parseInt(result.position),
            tyreManagement: tyreManagementScore,
            consistencyScore: Math.max(1, Math.min(10, consistencyScore)),
            overtakingScore: overtakingScore,
            defenseScore: defenseScore,
            weekendRating: weekendRating
        };
    }
    
    console.log('\n✓ Driver performance calculations completed');
    return performances;
}

function calculateTyreManagement(result, lapTimes) {
    // Placeholder for now
    return 8.5;
}

function calculateOvertakingScore(result) {
    const positionsGained = result.grid - result.position;
    return Math.min(10, Math.max(1, 5 + (positionsGained * 0.5)));
}

function calculateDefenseScore(result) {
    return 8.0;
}

function calculateWeekendRating(raceResult, qualifyingResult) {
    return 8.5;
}

async function generateRaceAnalytics(round) {
    console.log(`\n=== Processing Round ${round} ===`);
    try {
        // Fetch all race data
        const [
            raceResults, 
            qualifyingResults, 
            lapTimes, 
            pitStops,
            driverStandings,
            constructorStandings,
            sprintResults,
            circuitDetails
        ] = await Promise.all([
            fetchRaceResults(round),
            fetchQualifyingResults(round),
            fetchLapTimes(round),
            fetchPitStops(round),
            fetchDriverStandings(round),
            fetchConstructorStandings(round),
            fetchSprintResults(round),
            fetchCircuitDetails(round)
        ]);

        console.log(`\nStructuring data for ${raceResults.raceName}...`);

        // Validate fetched data
        if (!raceResults || !raceResults.Results || raceResults.Results.length === 0) {
            console.error(`No race results found for round ${round}`);
            return null;
        }

        if (!qualifyingResults || !qualifyingResults.QualifyingResults || qualifyingResults.QualifyingResults.length === 0) {
            console.error(`No qualifying results found for round ${round}`);
            return null;
        }

        // Structure the data according to our schema
        const raceData = {
            info: {
                name: raceResults.raceName,
                date: raceResults.date,
                circuit: {
                    ...raceResults.Circuit,
                    details: circuitDetails
                },
                laps: raceResults.Results[0].laps,
                distance: raceResults.Results[0].FastestLap?.AverageSpeed?.speed 
                    ? `${parseFloat(raceResults.Results[0].FastestLap.AverageSpeed.speed) * parseFloat(raceResults.Results[0].laps)} km`
                    : 'N/A'
            },
            results: {
                race: raceResults.Results.map(result => ({
                    position: parseInt(result.position),
                    driverId: result.Driver.driverId,
                    constructorId: result.Constructor.constructorId,
                    gridPosition: parseInt(result.grid),
                    lapsCompleted: parseInt(result.laps),
                    points: parseInt(result.points),
                    time: result.Time?.time || null,
                    status: result.status,
                    fastestLap: result.FastestLap ? {
                        lap: parseInt(result.FastestLap.lap),
                        time: result.FastestLap.Time.time,
                        averageSpeed: parseFloat(result.FastestLap.AverageSpeed?.speed || 0),
                        wasFastest: result.FastestLap.rank === "1"
                    } : null
                })),
                qualifying: {
                    q1: [],
                    q2: [],
                    q3: []
                },
                sprint: sprintResults ? {
                    results: sprintResults.SprintResults.map(result => ({
                        position: parseInt(result.position),
                        driverId: result.Driver.driverId,
                        constructorId: result.Constructor.constructorId,
                        gridPosition: parseInt(result.grid),
                        lapsCompleted: parseInt(result.laps),
                        points: parseInt(result.points),
                        time: result.Time?.time || null,
                        status: result.status
                    }))
                } : null
            },
            standings: {
                drivers: driverStandings.DriverStandings.map(standing => ({
                    position: parseInt(standing.position),
                    points: parseFloat(standing.points),
                    wins: parseInt(standing.wins),
                    driverId: standing.Driver.driverId,
                    constructorId: standing.Constructors[0].constructorId
                })),
                constructors: constructorStandings.ConstructorStandings.map(standing => ({
                    position: parseInt(standing.position),
                    points: parseFloat(standing.points),
                    wins: parseInt(standing.wins),
                    constructorId: standing.Constructor.constructorId
                }))
            },
            driverPerformance: await calculateDriverPerformance(
                raceResults,
                qualifyingResults,
                lapTimes
            )
        };

        console.log('Processing qualifying results...');
        qualifyingResults.QualifyingResults.forEach(result => {
            const baseResult = {
                position: parseInt(result.position),
                driverId: result.Driver.driverId,
                constructorId: result.Constructor.constructorId
            };
            
            if (result.Q1) raceData.results.qualifying.q1.push({ ...baseResult, time: result.Q1 });
            if (result.Q2) raceData.results.qualifying.q2.push({ ...baseResult, time: result.Q2 });
            if (result.Q3) raceData.results.qualifying.q3.push({ ...baseResult, time: result.Q3 });
        });

        console.log(`✓ Data processing completed for round ${round}\n`);
        return raceData;
    } catch (error) {
        console.error(`Error generating race analytics for round ${round}:`, error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

async function generate2024Data() {
    console.log('=== Starting 2024 F1 Data Generation ===\n');
    try {
        const data = {
            races: {
                "2024": {}
            }
        };

        // Fetch current schedule
        console.log('Fetching 2024 race schedule...');
        const scheduleUrl = `${ERGAST_BASE_URL}/${YEAR}.json`;
        const scheduleData = await fetchWithRetry(scheduleUrl);
        const totalRaces = parseInt(scheduleData.MRData.total);
        console.log(`Found ${totalRaces} races in the 2024 season`);

        // Process all races, not just completed ones
        const allRaces = scheduleData.MRData.RaceTable.Races;
        console.log(`Processing all ${allRaces.length} races...\n`);

        // Process each race
        for (const race of allRaces) {
            const round = parseInt(race.round);
            try {
                console.log(`\nProcessing ${race.raceName} (Round ${round})...`);
                const raceData = await generateRaceAnalytics(round);
                if (raceData) {
                    data.races["2024"][round] = raceData;
                    console.log(`✓ Successfully processed ${race.raceName}`);
                }
                // Add delay to respect API rate limits
                if (round < allRaces.length) {
                    console.log('Waiting 1 second before next race...');
                    await delay(1000);
                }
            } catch (error) {
                console.error(`Failed to process round ${round}:`, error.message);
            }
        }

        // Write to file
        console.log('\nWriting data to file...');
        const filePath = path.join(process.cwd(), 'data', '2024_data.json');
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log('\n✓ Data successfully written to 2024_data.json');
        console.log('\n=== Data Generation Complete ===');

    } catch (error) {
        console.error('\nError generating 2024 data:', error);
        process.exit(1);
    }
}

// Execute the data generation
generate2024Data();
