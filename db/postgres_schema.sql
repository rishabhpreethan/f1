-- Postgres schema for Vercel Postgres

-- seasons
CREATE TABLE IF NOT EXISTS seasons (
  season_id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  url TEXT
);

-- races
CREATE TABLE IF NOT EXISTS races (
  race_id SERIAL PRIMARY KEY,
  season_id INTEGER REFERENCES seasons(season_id),
  round INTEGER,
  name TEXT,
  date DATE,
  time TEXT,
  url TEXT
);

-- Ensure one race per season/round
CREATE UNIQUE INDEX IF NOT EXISTS idx_races_season_round
  ON races(season_id, round);

-- circuits
CREATE TABLE IF NOT EXISTS circuits (
  circuit_id TEXT PRIMARY KEY,
  name TEXT,
  location TEXT,
  country TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  url TEXT
);

-- drivers
CREATE TABLE IF NOT EXISTS drivers (
  driver_id TEXT PRIMARY KEY,
  code TEXT,
  number INTEGER,
  forename TEXT,
  surname TEXT,
  dob DATE,
  nationality TEXT,
  url TEXT
);

-- constructors
CREATE TABLE IF NOT EXISTS constructors (
  constructor_id TEXT PRIMARY KEY,
  name TEXT,
  nationality TEXT,
  url TEXT
);

-- race_results
CREATE TABLE IF NOT EXISTS race_results (
  result_id SERIAL PRIMARY KEY,
  race_id INTEGER REFERENCES races(race_id),
  driver_id TEXT REFERENCES drivers(driver_id),
  constructor_id TEXT REFERENCES constructors(constructor_id),
  grid INTEGER,
  position INTEGER,
  points DOUBLE PRECISION,
  laps INTEGER,
  status TEXT,
  time TEXT,
  fastest_lap INTEGER,
  fastest_lap_time TEXT
);

-- One row per race/driver
CREATE UNIQUE INDEX IF NOT EXISTS idx_race_results_unique
  ON race_results(race_id, driver_id);

-- qualifying_results
CREATE TABLE IF NOT EXISTS qualifying_results (
  qualifying_id SERIAL PRIMARY KEY,
  race_id INTEGER REFERENCES races(race_id),
  driver_id TEXT REFERENCES drivers(driver_id),
  constructor_id TEXT REFERENCES constructors(constructor_id),
  position INTEGER,
  q1_time TEXT,
  q2_time TEXT,
  q3_time TEXT
);

-- One row per race/driver
CREATE UNIQUE INDEX IF NOT EXISTS idx_qualifying_results_unique
  ON qualifying_results(race_id, driver_id);

-- sprint_results
CREATE TABLE IF NOT EXISTS sprint_results (
  sprint_result_id SERIAL PRIMARY KEY,
  race_id INTEGER REFERENCES races(race_id),
  driver_id TEXT REFERENCES drivers(driver_id),
  constructor_id TEXT REFERENCES constructors(constructor_id),
  position INTEGER,
  grid INTEGER,
  points INTEGER,
  laps INTEGER,
  status TEXT,
  time TEXT,
  fastest_lap INTEGER,
  fastest_lap_time TEXT
);

-- One row per race/driver
CREATE UNIQUE INDEX IF NOT EXISTS idx_sprint_results_unique
  ON sprint_results(race_id, driver_id);

-- driver_standings
CREATE TABLE IF NOT EXISTS driver_standings (
  standing_id SERIAL PRIMARY KEY,
  race_id INTEGER REFERENCES races(race_id),
  driver_id TEXT REFERENCES drivers(driver_id),
  points DOUBLE PRECISION,
  position INTEGER,
  wins INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_standings_unique
  ON driver_standings(race_id, driver_id);

-- constructor_standings
CREATE TABLE IF NOT EXISTS constructor_standings (
  standing_id SERIAL PRIMARY KEY,
  race_id INTEGER REFERENCES races(race_id),
  constructor_id TEXT REFERENCES constructors(constructor_id),
  points DOUBLE PRECISION,
  position INTEGER,
  wins INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_constructor_standings_unique
  ON constructor_standings(race_id, constructor_id);

-- status
CREATE TABLE IF NOT EXISTS status (
  status_id SERIAL PRIMARY KEY,
  status TEXT
);

-- lap_times
CREATE TABLE IF NOT EXISTS lap_times (
  lap_id SERIAL PRIMARY KEY,
  race_id INTEGER REFERENCES races(race_id),
  driver_id TEXT REFERENCES drivers(driver_id),
  lap INTEGER,
  position INTEGER,
  time TEXT
);

-- pit_stops
CREATE TABLE IF NOT EXISTS pit_stops (
  pit_stop_id SERIAL PRIMARY KEY,
  race_id INTEGER REFERENCES races(race_id),
  driver_id TEXT REFERENCES drivers(driver_id),
  stop INTEGER,
  lap INTEGER,
  time TEXT,
  duration TEXT
);

-- users and auth
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password TEXT NOT NULL
);
