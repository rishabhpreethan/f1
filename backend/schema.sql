-- F1 Database Schema

CREATE TABLE IF NOT EXISTS seasons (
    season_id INTEGER PRIMARY KEY,
    year INTEGER NOT NULL,
    url TEXT
);

CREATE TABLE IF NOT EXISTS races (
    race_id INTEGER PRIMARY KEY,
    season_id INTEGER,
    round INTEGER,
    name TEXT,
    date TEXT,
    time TEXT,
    url TEXT,
    FOREIGN KEY (season_id) REFERENCES seasons(season_id)
);

CREATE TABLE IF NOT EXISTS circuits (
    circuit_id TEXT PRIMARY KEY,
    name TEXT,
    location TEXT,
    country TEXT,
    lat REAL,
    lng REAL,
    url TEXT
);

CREATE TABLE IF NOT EXISTS drivers (
    driver_id TEXT PRIMARY KEY,
    code TEXT,
    number INTEGER,
    forename TEXT,
    surname TEXT,
    dob TEXT,
    nationality TEXT,
    url TEXT
);

CREATE TABLE IF NOT EXISTS constructors (
    constructor_id TEXT PRIMARY KEY,
    name TEXT,
    nationality TEXT,
    url TEXT
);

CREATE TABLE IF NOT EXISTS race_results (
    result_id INTEGER PRIMARY KEY,
    race_id INTEGER,
    driver_id TEXT,
    constructor_id TEXT,
    grid INTEGER,
    position INTEGER,
    points REAL,
    laps INTEGER,
    status TEXT,
    time TEXT,
    fastest_lap INTEGER,
    fastest_lap_time TEXT,
    FOREIGN KEY (race_id) REFERENCES races(race_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    FOREIGN KEY (constructor_id) REFERENCES constructors(constructor_id)
);

CREATE TABLE IF NOT EXISTS qualifying_results (
    qualifying_id INTEGER PRIMARY KEY,
    race_id INTEGER,
    driver_id TEXT,
    constructor_id TEXT,
    position INTEGER,
    q1_time TEXT,
    q2_time TEXT,
    q3_time TEXT,
    FOREIGN KEY (race_id) REFERENCES races(race_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    FOREIGN KEY (constructor_id) REFERENCES constructors(constructor_id)
);

CREATE TABLE IF NOT EXISTS sprint_results (
    sprint_result_id INTEGER PRIMARY KEY,
    race_id INTEGER,
    driver_id TEXT,
    constructor_id TEXT,
    position INTEGER,
    grid INTEGER,
    points INTEGER,
    laps INTEGER,
    status TEXT,
    time TEXT,
    fastest_lap INTEGER,
    fastest_lap_time TEXT,
    FOREIGN KEY (race_id) REFERENCES races(race_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    FOREIGN KEY (constructor_id) REFERENCES constructors(constructor_id)
);

CREATE TABLE IF NOT EXISTS driver_standings (
    standing_id INTEGER PRIMARY KEY,
    race_id INTEGER,
    driver_id TEXT,
    points REAL,
    position INTEGER,
    wins INTEGER,
    FOREIGN KEY (race_id) REFERENCES races(race_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id)
);

CREATE TABLE IF NOT EXISTS constructor_standings (
    standing_id INTEGER PRIMARY KEY,
    race_id INTEGER,
    constructor_id TEXT,
    points REAL,
    position INTEGER,
    wins INTEGER,
    FOREIGN KEY (race_id) REFERENCES races(race_id),
    FOREIGN KEY (constructor_id) REFERENCES constructors(constructor_id)
);

CREATE TABLE IF NOT EXISTS status (
    status_id INTEGER PRIMARY KEY,
    status TEXT
);

CREATE TABLE IF NOT EXISTS lap_times (
    lap_id INTEGER PRIMARY KEY,
    race_id INTEGER,
    driver_id TEXT,
    lap INTEGER,
    position INTEGER,
    time TEXT,
    FOREIGN KEY (race_id) REFERENCES races(race_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id)
);

CREATE TABLE IF NOT EXISTS pit_stops (
    pit_stop_id INTEGER PRIMARY KEY,
    race_id INTEGER,
    driver_id TEXT,
    stop INTEGER,
    lap INTEGER,
    time TEXT,
    duration TEXT,
    FOREIGN KEY (race_id) REFERENCES races(race_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id)
);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
