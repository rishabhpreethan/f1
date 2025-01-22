import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
        <Card className="w-full">
          <div className="p-6">
            <div className="flex items-start justify-between">
              {/* Left Section - Constructor Logo */}
              <div className="flex-shrink-0 mr-8">
                <div className="w-44 h-28">
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
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    {constructorProfile.name}
                  </h2>
                  <div className="flex items-center space-x-2 mb-4">
                    <img
                      src={`/flag-images/${getCountryCode(constructorProfile.nationality)}.png`}
                      alt={constructorProfile.nationality}
                      className="h-4 w-6 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span className="text-sm text-gray-600">
                      {constructorProfile.nationality}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Section - Drivers */}
              <div className="flex-shrink-0 ml-8">
                <div className="flex space-x-4">
                  {constructorDrivers.map((driver, index) => (
                    <div key={driver.driver_id} className="text-center">
                      <div className="w-24 h-24 mb-2 relative">
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
                      <div className="text-sm font-medium">{driver.code}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Wikipedia Link - Bottom Right */}
            <div className="flex justify-end mt-4">
              <a
                href={constructorProfile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-150"
              >
                View on Wikipedia →
              </a>
            </div>
          </div>
        </Card>
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
      <div className="grid grid-cols-2 gap-4">
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

    </div>
  );
}

export default ConstructorAnalytics;
