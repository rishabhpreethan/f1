import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Trophy, Flag, Timer, TrendingUp, Medal, ChevronDown, ChevronUp } from "lucide-react";

const getCountryCode = (nationality) => {
  const countryMap = {
    'British': 'gb',
    'German': 'de',
    'Dutch': 'nl',
    'Spanish': 'es',
    'Mexican': 'mx',
    'French': 'fr',
    'Italian': 'it',
    'Finnish': 'fi',
    'Danish': 'dk',
    'Australian': 'au',
    'Canadian': 'ca',
    'Thai': 'th',
    'Chinese': 'cn',
    'Japanese': 'jp',
    'American': 'us',
    'Austrian': 'at',
    'Swiss': 'ch',
    'Brazilian': 'br',
    'Belgian': 'be',
    'Monégasque': 'mc',
    'Russian': 'ru',
    'Polish': 'pl',
    'Swedish': 'se',
    'Hungarian': 'hu',
    'Portuguese': 'pt',
    'New Zealander': 'nz'
  };
  return countryMap[nationality] || 'gb'; // Default to GB if nationality not found
};

const CustomDot = (props) => {
  const { cx, cy, payload } = props;

  // Show trophy if any driver scored 25 or more points
  const driverPoints = payload.driver_points?.split(',').map(Number) || [];
  if (driverPoints.some(points => points >= 25)) {
    const trophyOffset = cy < 30 ? 15 : -15;
    return (
      <>
        <circle 
          cx={cx} 
          cy={cy} 
          r={3} 
          stroke="#e00400" 
          strokeWidth={2}
          fill="white"
        />
        <svg 
          x={cx - 5} 
          y={cy + trophyOffset} 
          width={10} 
          height={10} 
          fill="#FFD700"
          viewBox="0 0 16 16"
        >
          <path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5c0 .538-.012 1.05-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33.076 33.076 0 0 1 2.5.5zm.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935zm10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935z"/>
        </svg>
      </>
    );
  }

  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={3} 
      stroke="#e00400" 
      strokeWidth={2}
      fill="white"
    />
  );
};

function ConstructorAnalytics() {
  const [selectedConstructor, setSelectedConstructor] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [constructors, setConstructors] = useState([]);
  const [years, setYears] = useState([]);
  const [availableConstructors, setAvailableConstructors] = useState([]);
  const [constructorStats, setConstructorStats] = useState(null);
  const [constructorProfile, setConstructorProfile] = useState(null);
  const [constructorDrivers, setConstructorDrivers] = useState([]);
  const [driverPointsData, setDriverPointsData] = useState({ drivers: [], data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('race');
  const [raceResults, setRaceResults] = useState([]);
  const [qualifyingResults, setQualifyingResults] = useState([]);
  const [sprintResults, setSprintResults] = useState([]);
  const resultsRef = useRef(null);
  const resultsButtonRef = useRef(null);

  // Process results data
  const processResults = (data, type) => {
    // Group results by round
    const groupedResults = data.reduce((acc, curr) => {
      const existingRound = acc.find(r => r.round === curr.round);
      if (existingRound) {
        existingRound.drivers.push({
          code: curr.driverName.split(' ')[0], // Using first name as code for now
          position: curr.position,
          grid: curr.grid,
          points: curr.points,
          status: curr.status,
          time: curr.time,
          q1: curr.q1,
          q2: curr.q2,
          q3: curr.q3
        });
      } else {
        acc.push({
          round: curr.round,
          race_name: curr.raceName,
          drivers: [{
            code: curr.driverName.split(' ')[0], // Using first name as code for now
            position: curr.position,
            grid: curr.grid,
            points: curr.points,
            status: curr.status,
            time: curr.time,
            q1: curr.q1,
            q2: curr.q2,
            q3: curr.q3
          }]
        });
      }
      return acc;
    }, []);

    // Sort drivers within each round by position
    return groupedResults.map(round => ({
      ...round,
      drivers: round.drivers.sort((a, b) => (a.position || 999) - (b.position || 999))
    }));
  };

  // Fetch years and initial constructors
  useEffect(() => {
    console.log('Fetching constructors...');
    setLoading(true);
    setError(null);
    
    fetch('http://localhost:3001/api/constructors')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch constructors');
        return res.json();
      })
      .then(data => {
        console.log('Received constructors:', data);
        setConstructors(data.constructors);
        setYears(data.years);
        if (data.years.length > 0) {
          setSelectedYear(data.years[0]);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setError('Failed to fetch constructors');
        setLoading(false);
      });
  }, []);

  // Update available constructors when year changes
  useEffect(() => {
    if (selectedYear) {
      fetch(`http://localhost:3001/api/constructors?year=${selectedYear}`)
        .then(res => res.json())
        .then(data => {
          setAvailableConstructors(data.constructors);
          // If current selected constructor is not available in this year, reset it
          if (selectedConstructor && !data.constructors.find(c => c.constructor_id === selectedConstructor)) {
            setSelectedConstructor(null);
          }
          // If no constructor is selected and we have constructors available, select the first one
          if (!selectedConstructor && data.constructors.length > 0) {
            setSelectedConstructor(data.constructors[0].constructor_id);
          }
        })
        .catch(error => console.error('Error fetching constructors for year:', error));
    }
  }, [selectedYear]);

  // Fetch constructor data
  useEffect(() => {
    if (selectedConstructor && selectedYear) {
      console.log('Fetching data for constructor:', selectedConstructor, 'and year:', selectedYear);
      setLoading(true);
      setError(null);

      Promise.all([
        fetch(`http://localhost:3001/api/constructor-stats/${selectedConstructor}?year=${selectedYear}`),
        fetch(`http://localhost:3001/api/constructor-profile/${selectedConstructor}`),
        fetch(`http://localhost:3001/api/constructor-drivers/${selectedConstructor}?year=${selectedYear}`),
        fetch(`http://localhost:3001/api/constructor-driver-points/${selectedConstructor}?year=${selectedYear}`),
        fetch(`http://localhost:3001/api/constructor-race-results/${selectedConstructor}?year=${selectedYear}`),
        fetch(`http://localhost:3001/api/constructor-qualifying-results/${selectedConstructor}?year=${selectedYear}`),
        fetch(`http://localhost:3001/api/constructor-sprint-results/${selectedConstructor}?year=${selectedYear}`)
      ])
        .then(([statsRes, profileRes, driversRes, pointsRes, raceResultsRes, qualifyingResultsRes, sprintResultsRes]) => 
          Promise.all([statsRes.json(), profileRes.json(), driversRes.json(), pointsRes.json(), raceResultsRes.json(), qualifyingResultsRes.json(), sprintResultsRes.json()])
        )
        .then(([statsData, profileData, driversData, pointsData, raceResultsData, qualifyingResultsData, sprintResultsData]) => {
          console.log('Received data:', { statsData, profileData, driversData, pointsData, raceResultsData, qualifyingResultsData, sprintResultsData });
          
          setConstructorStats(statsData);
          setConstructorProfile(profileData);
          setConstructorDrivers(driversData);
          setDriverPointsData({
            drivers: [...new Set(pointsData.map(d => d.driverName))],
            data: pointsData
          });
          
          // Process and set results
          setRaceResults(processResults(raceResultsData));
          setQualifyingResults(processResults(qualifyingResultsData));
          setSprintResults(processResults(sprintResultsData));
          
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching constructor data:', error);
          setError('Failed to load constructor data. Please try again later.');
          setLoading(false);
        });
    }
  }, [selectedConstructor, selectedYear]);

  // Process driver points data when it's received
  useEffect(() => {
    if (constructorDrivers.length > 0 && selectedYear) {
      fetch(`http://localhost:3001/api/constructor-driver-points/${selectedConstructor}?year=${selectedYear}`)
        .then(res => res.json())
        .then(data => {
          // Process the data to get unique drivers and their points per race
          const drivers = [...new Set(data.map(d => d.driverName))];
          const processedData = data.reduce((acc, curr) => {
            const existingRace = acc.find(r => r.round === curr.round);
            if (existingRace) {
              existingRace[curr.driverName] = curr.points;
            } else {
              acc.push({
                round: curr.round,
                raceName: curr.raceName,
                [curr.driverName]: curr.points
              });
            }
            return acc;
          }, []);
          
          setDriverPointsData({
            drivers,
            data: processedData
          });
        })
        .catch(error => console.error('Error fetching driver points:', error));
    }
  }, [constructorDrivers, selectedConstructor, selectedYear]);

  const toggleResults = () => {
    setShowResults(!showResults);
    if (!showResults) {
      // Wait for the animation to start before scrolling
      setTimeout(() => {
        resultsButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="space-y-8 bg-white">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Constructor Analytics</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-48">
            <Select
              value={selectedYear?.toString()}
              onValueChange={(value) => {
                setSelectedYear(parseInt(value));
                setShowResults(true);
                if (resultsRef.current) {
                  resultsRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Select
              value={selectedConstructor}
              onValueChange={(value) => {
                setSelectedConstructor(value);
                setShowResults(true);
                if (resultsRef.current) {
                  resultsRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a constructor" />
              </SelectTrigger>
              <SelectContent>
                {availableConstructors.map((constructor) => (
                  <SelectItem key={constructor.constructor_id} value={constructor.constructor_id}>
                    {constructor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Constructor Profile Card */}
      {constructorProfile && (
        <div className="mb-6">
          <Card className="w-full">
            <div className="p-6">
              <div className="flex items-center justify-between">
                {/* Left Section - Constructor Logo */}
                <div className="flex-shrink-0 mr-8">
                  <div className="w-62 h-20">
                    <img
                      src={`/team-logos/${constructorProfile.name.toLowerCase()
                        .replace(/\s+f1\s+team/i, '')
                        .replace(/\s+/g, '-')
                        .trim()}.png`}
                      alt={constructorProfile.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.parentElement.innerHTML = `<div class="flex items-center justify-center w-full h-full bg-gray-50 text-xl font-bold text-gray-400">${constructorProfile.name || '?'}</div>`;
                      }}
                    />
                  </div>
                </div>

                {/* Middle Section - Constructor Info */}
                <div className="flex-grow">
                  <div className="flex flex-col">
                    <h2 className="text-4xl font-semibold text-gray-900">
                      {constructorProfile.name}
                    </h2>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <img
                        src={`/flag-images/${getCountryCode(constructorProfile.nationality)}.png`}
                        alt={constructorProfile.nationality}
                        className="h-5 w-7 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="text-base text-gray-600">
                        {constructorProfile.nationality}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Drivers */}
                <div className="flex-shrink-0 ml-8">
                  <div className="flex space-x-6">
                    {constructorDrivers.map((driver, index) => (
                      <div key={driver.driver_id} className="text-center">
                        <div className="w-20 h-20 mb-2 relative">
                          <img
                            src={`/driver-images/${driver.code.toLowerCase()}.png`}
                            alt={`${driver.forename} ${driver.surname}`}
                            className="w-full h-full object-cover rounded-full border-2 border-gray-200"
                            onError={(e) => {
                              e.target.src = `/driver-images/alb.png`;
                            }}
                          />
                          <img
                            src={`/flag-images/${getCountryCode(driver.nationality)}.png`}
                            alt={driver.nationality}
                            className="absolute bottom-0 right-0 w-6 h-4 object-cover border border-gray-200 shadow-sm"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{driver.code}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Wikipedia Link - Bottom Right */}
              <div className="flex justify-end mt-2">
                <a
                  href={constructorProfile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-150 flex items-center space-x-1"
                >
                  <span>View on Wikipedia</span>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Overview Cards */}
      {constructorStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Championship Position</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P{constructorProfile?.championship_position}</div>
              <p className="text-xs text-muted-foreground">
                Current standing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{constructorStats.stats.total_points}</div>
              <p className="text-xs text-muted-foreground">
                Championship points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Race Wins</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{constructorStats.stats.wins}</div>
              <p className="text-xs text-muted-foreground">
                Total victories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sprint Wins</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{constructorStats.stats.sprint_wins}</div>
              <p className="text-xs text-muted-foreground">
                Sprint race victories
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        {/* Points Progression Chart */}
        {constructorStats && (
          <Card>
            <CardHeader>
              <CardTitle>Points Progression</CardTitle>
              <CardDescription>Constructor championship points throughout the season</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={constructorStats.pointsProgression}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="round"
                      label={{ value: 'Race', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      label={{
                        value: 'Points',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20 shadow-xl">
                              <p className="text-sm font-medium mb-2">{data.raceName}</p>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 rounded-[2px] bg-[#e00400]" />
                                  <span className="text-xs">Race Points</span>
                                  <span className="ml-auto text-xs font-mono">{data.racePoints}</span>
                                </div>
                                {data.sprintPoints > 0 && (
                                  <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-[2px] bg-[#9333ea]" />
                                    <span className="text-xs">Sprint Points</span>
                                    <span className="ml-auto text-xs font-mono">{data.sprintPoints}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 border-t border-white/10 mt-2 pt-2">
                                  <div className="h-2.5 w-2.5 rounded-[2px] bg-[#22c55e]" />
                                  <span className="text-xs">Total Points</span>
                                  <span className="ml-auto text-xs font-mono">{data.cumulativePoints}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativePoints"
                      stroke="#e00400"
                      strokeWidth={2}
                      dot={<CustomDot />}
                      name="Cumulative Points"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Driver Points Contribution Chart */}
        {driverPointsData && (
          <Card>
            <CardHeader>
              <CardTitle>Driver Points Contribution</CardTitle>
              <CardDescription>Points scored by each driver per race</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={driverPointsData.data}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="round"
                      label={{ value: 'Race', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      label={{
                        value: 'Points',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const raceName = payload[0]?.payload.raceName;
                          return (
                            <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20 shadow-xl">
                              <p className="text-sm font-medium mb-2">{raceName}</p>
                              <div className="space-y-1">
                                {payload.map((entry, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <div 
                                      className="h-2.5 w-2.5 rounded-[2px]"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-xs">{entry.name}</span>
                                    <span className="ml-auto text-xs font-mono">{entry.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {driverPointsData.drivers.map((driver, index) => (
                      <Area
                        key={driver}
                        type="monotone"
                        dataKey={driver}
                        stackId="1"
                        stroke={`hsl(${(index * 360) / driverPointsData.drivers.length}, 70%, 50%)`}
                        fill={`hsl(${(index * 360) / driverPointsData.drivers.length}, 70%, 50%)`}
                        name={driver}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Tables */}
      <div className="mt-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <button
            ref={resultsButtonRef}
            onClick={toggleResults}
            className="w-full flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm focus:outline-none whitespace-nowrap"
          >
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold">Session Results</h3>
            </div>
            <div className={`transform transition-transform duration-300 ${showResults ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </div>
          </button>
          
          <div 
            ref={resultsRef}
            className={`transform transition-all duration-300 ease-in-out origin-top ${showResults ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 h-0'}`}
          >
            <div className="border-t border-gray-200">
              {/* Sliding Window Tabs */}
              <div className="space-y-4 bg-gray-100/80 p-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-full max-w-md">
                    {/* Background Options */}
                    <div className="relative flex w-full bg-gray-100/80 rounded-lg shadow-sm">
                      {/* Sliding Window */}
                      <div
                        className="absolute inset-0 w-1/3 bg-white rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-transform duration-200 ease-out z-10"
                        style={{
                          transform: `translateX(${activeTab === 'race' ? '0%' : activeTab === 'qualifying' ? '100%' : '200%'})`
                        }}
                      />
                      <button
                        onClick={() => setActiveTab('race')}
                        className={`relative flex-1 py-1.5 px-4 text-sm font-medium text-center bg-transparent rounded-lg z-20 focus:outline-none whitespace-nowrap ${
                          activeTab === 'race' ? 'text-black' : 'text-gray-500'
                        }`}
                      >
                        Race Results
                      </button>
                      <button
                        onClick={() => setActiveTab('qualifying')}
                        className={`relative flex-1 py-1.5 px-4 text-sm font-medium text-center bg-transparent rounded-lg z-20 focus:outline-none whitespace-nowrap ${
                          activeTab === 'qualifying' ? 'text-black' : 'text-gray-500'
                        }`}
                      >
                        Qualifying Results
                      </button>
                      <button
                        onClick={() => setActiveTab('sprint')}
                        className={`relative flex-1 py-1.5 px-4 text-sm font-medium text-center bg-transparent rounded-lg z-20 focus:outline-none whitespace-nowrap ${
                          activeTab === 'sprint' ? 'text-black' : 'text-gray-500'
                        }`}
                      >
                        Sprint Results
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tables */}
              <div className="overflow-x-auto">
                {activeTab === 'race' ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Race</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grid</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {raceResults.map((result, index) => (
                        result.drivers.map((driver, driverIndex) => (
                          <tr key={`${index}-${driverIndex}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {driverIndex === 0 && (
                              <>
                                <td rowSpan={result.drivers.length} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">R{result.round}</td>
                                <td rowSpan={result.drivers.length} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{result.race_name}</td>
                              </>
                            )}
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{driver.code}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              <span className="text-gray-500">P{driver.grid}</span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                driver.position <= 3 ? 'bg-green-100 text-green-800' : 
                                driver.position <= 10 ? 'bg-blue-100 text-blue-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                P{driver.position}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{driver.points}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                driver.status === 'Finished' ? 'bg-green-100 text-green-800' : 
                                driver.status.startsWith('+') ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {driver.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-900">{driver.time || '-'}</td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                ) : activeTab === 'qualifying' ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Race</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {qualifyingResults.map((result, index) => (
                        result.drivers.map((driver, driverIndex) => (
                          <tr key={`${index}-${driverIndex}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {driverIndex === 0 && (
                              <>
                                <td rowSpan={result.drivers.length} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">R{result.round}</td>
                                <td rowSpan={result.drivers.length} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{result.race_name}</td>
                              </>
                            )}
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{driver.code}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                driver.position <= 3 ? 'bg-green-100 text-green-800' : 
                                driver.position <= 10 ? 'bg-blue-100 text-blue-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                P{driver.position}
                              </span>
                            </td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Race</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sprintResults.map((result, index) => (
                        result.drivers.map((driver, driverIndex) => (
                          <tr key={`${index}-${driverIndex}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {driverIndex === 0 && (
                              <>
                                <td rowSpan={result.drivers.length} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">R{result.round}</td>
                                <td rowSpan={result.drivers.length} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{result.race_name}</td>
                              </>
                            )}
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{driver.code}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                driver.position <= 3 ? 'bg-green-100 text-green-800' : 
                                driver.position <= 10 ? 'bg-blue-100 text-blue-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                P{driver.position}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{driver.points}</td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default ConstructorAnalytics;
