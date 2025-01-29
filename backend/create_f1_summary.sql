CREATE TABLE IF NOT EXISTS f1_summary (
    race_id INTEGER,
    season_year INTEGER,
    round INTEGER,
    race_name TEXT,
    race_date TEXT,
    circuit_name TEXT,
    circuit_location TEXT,
    circuit_country TEXT,
    
    driver_id TEXT,
    driver_code TEXT,
    driver_number INTEGER,
    driver_name TEXT,
    driver_dob TEXT,
    driver_nationality TEXT,

    constructor_id TEXT,
    constructor_name TEXT,
    constructor_nationality TEXT,

    grid_position INTEGER,
    race_position INTEGER,
    points REAL,
    laps_completed INTEGER,
    status TEXT,
    fastest_lap INTEGER,
    fastest_lap_time TEXT,

    PRIMARY KEY (race_id, driver_id),
    FOREIGN KEY (race_id) REFERENCES races(race_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    FOREIGN KEY (constructor_id) REFERENCES constructors(constructor_id)
);

INSERT INTO f1_summary (race_id, season_year, round, race_name, race_date, circuit_name, circuit_location, circuit_country, 
                        driver_id, driver_code, driver_number, driver_name, driver_dob, driver_nationality,
                        constructor_id, constructor_name, constructor_nationality, grid_position, race_position, points, 
                        laps_completed, status, fastest_lap, fastest_lap_time)
SELECT 
    r.race_id, s.year, r.round, r.name, r.date, c.name, c.location, c.country,
    d.driver_id, d.code, d.number, d.forename || ' ' || d.surname, d.dob, d.nationality,
    cons.constructor_id, cons.name, cons.nationality,
    rr.grid, rr.position, rr.points, rr.laps, rr.status, rr.fastest_lap, rr.fastest_lap_time
FROM race_results rr
JOIN races r ON rr.race_id = r.race_id
JOIN seasons s ON r.season_id = s.year
JOIN circuits c ON r.circuit_id = c.circuit_id
JOIN drivers d ON rr.driver_id = d.driver_id
JOIN constructors cons ON rr.constructor_id = cons.constructor_id;
