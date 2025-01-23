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
  const [constructors, setConstructors] = useState([]);
  const [constructorStats, setConstructorStats] = useState(null);
  const [constructorProfile, setConstructorProfile] = useState(null);
  const [constructorDrivers, setConstructorDrivers] = useState([]);
  const [driverPointsData, setDriverPointsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('race');
  const [raceResults, setRaceResults] = useState([]);
  const [qualifyingResults, setQualifyingResults] = useState([]);
  const [sprintResults, setSprintResults] = useState([]);
  const resultsRef = useRef(null);
  const resultsButtonRef = useRef(null);

  // Fetch constructors for dropdown
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
        setConstructors(data);
        if (data.length > 0) {
          setSelectedConstructor(data[0].constructorId);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching constructors:', error);
        setError('Failed to load constructors. Please try again later.');
        setLoading(false);
      });
  }, []);

  // Fetch constructor stats and profile when selection changes
  useEffect(() => {
    if (selectedConstructor) {
      console.log('Fetching data for constructor:', selectedConstructor);
      setLoading(true);
      setError(null);

      Promise.all([
        fetch(`http://localhost:3001/api/constructor-stats/${selectedConstructor}`),
        fetch(`http://localhost:3001/api/constructor-profile/${selectedConstructor}`),
        fetch(`http://localhost:3001/api/constructor-drivers/${selectedConstructor}`),
        fetch(`http://localhost:3001/api/constructor-driver-points/${selectedConstructor}`)
      ])
        .then(([statsRes, profileRes, driversRes, pointsRes]) => Promise.all([statsRes.json(), profileRes.json(), driversRes.json(), pointsRes.json()]))
        .then(([statsData, profileData, driversData, pointsData]) => {
          console.log('Received stats:', statsData);
          console.log('Received profile:', profileData);
          console.log('Received drivers:', driversData);
          console.log('Received points data:', pointsData);
          setConstructorStats(statsData);
          setConstructorProfile(profileData);
          setConstructorDrivers(driversData);
          setDriverPointsData(pointsData);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching constructor data:', error);
          setError('Failed to load constructor data. Please try again later.');
          setLoading(false);
        });
    }
  }, [selectedConstructor]);

  useEffect(() => {
    if (selectedConstructor) {
      // Fetch race results
      fetch(`http://localhost:3001/api/constructor-race-results/${selectedConstructor}`)
        .then(res => res.json())
        .then(data => setRaceResults(data))
        .catch(error => console.error('Error fetching race results:', error));

      // Fetch qualifying results
      fetch(`http://localhost:3001/api/constructor-qualifying-results/${selectedConstructor}`)
        .then(res => res.json())
        .then(data => setQualifyingResults(data))
        .catch(error => console.error('Error fetching qualifying results:', error));

      // Fetch sprint results
      fetch(`http://localhost:3001/api/constructor-sprint-results/${selectedConstructor}`)
        .then(res => res.json())
        .then(data => setSprintResults(data))
        .catch(error => console.error('Error fetching sprint results:', error));
    }
  }, [selectedConstructor]);

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
      {/* Constructor Selection */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Constructor Analytics</h2>
          <p className="text-muted-foreground">
            Detailed performance analysis for Formula 1 constructors
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedConstructor} onValueChange={setSelectedConstructor}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Constructor" />
            </SelectTrigger>
            <SelectContent>
              {constructors.map(constructor => (
                <SelectItem 
                  key={constructor.constructorId} 
                  value={constructor.constructorId}
                >
                  {constructor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                    data={driverPointsData.pointsData}
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
