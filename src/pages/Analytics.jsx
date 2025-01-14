import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  Cell,
  ReferenceLine
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Trophy, Flag, Timer, TrendingUp, Medal, ChevronDown, ChevronUp } from "lucide-react";

const CustomDot = (props) => {
  const { cx, cy, payload } = props;

  // Show trophy for race wins (25 or 26 race points)
  if (payload.race_points === 26 || payload.race_points === 25) {
    // Position trophy above the line, but if too close to top, show below
    const trophyOffset = cy < 30 ? 15 : -15;
    
    // Purple trophy for 26 points, gold for 25 points
    const trophyColor = payload.race_points === 26 ? "#9333ea" : "#FFD700";

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
          fill={trophyColor}
          viewBox="0 0 16 16"
        >
          <path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5c0 .538-.012 1.05-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33.076 33.076 0 0 1 2.5.5zm.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935zm10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935z"/>
        </svg>
      </>
    );
  }

  // Default dot for non-win races
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

const PositionDot = (props) => {
  const { cx, cy, payload, chartHeight } = props;
  
  // Check if this point represents a P1 finish
  if (payload.position === 1) {
    // For P1, if we're too close to the top of the chart (within 30px), show trophy below
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
  
  // Default dot for non-P1 positions
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

function Analytics() {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [driverStats, setDriverStats] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [qualifyingResults, setQualifyingResults] = useState([]);
  const [raceResults, setRaceResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('race'); // 'qualifying' or 'race'
  const [loading, setLoading] = useState(true);
  const [positionsRange, setPositionsRange] = useState({ min: -20, max: 20 });

  // Fetch drivers for dropdown
  useEffect(() => {
    fetch('http://localhost:3001/api/drivers')
      .then(res => res.json())
      .then(data => {
        setDrivers(data);
        if (data.length > 0) {
          setSelectedDriver(data[0].driverId);
        }
      })
      .catch(error => console.error('Error fetching drivers:', error));
  }, []);

  // Fetch driver stats when selection changes
  useEffect(() => {
    if (selectedDriver) {
      setLoading(true);
      Promise.all([
        fetch(`http://localhost:3001/api/driver-stats/${selectedDriver}`),
        fetch(`http://localhost:3001/api/qualifying-results/${selectedDriver}`),
        fetch(`http://localhost:3001/api/race-results/${selectedDriver}`),
        fetch(`http://localhost:3001/api/driver-profile/${selectedDriver}`)
      ])
        .then(async ([statsRes, qualifyingRes, raceRes, profileRes]) => {
          const [statsData, qualifyingData, raceData, profileData] = await Promise.all([
            statsRes.json(),
            qualifyingRes.json(),
            raceRes.json(),
            profileRes.json()
          ]);

          // Process stats data
          if (!statsData.pointsProgression || !statsData.racePositions) {
            throw new Error('Invalid data format received');
          }

          // Process the data to ensure numbers and calculate cumulative points
          const processedData = {
            pointsProgression: statsData.pointsProgression.map((item, index, arr) => {
              // Calculate cumulative points
              const cumulativePoints = arr
                .slice(0, index + 1)
                .reduce((sum, race) => sum + Number(race.points || 0), 0);
              
              return {
                round: Number(item.round),
                points: Number(item.points || 0),
                race_points: Number(item.race_points || 0),
                sprint_points: Number(item.sprint_points || 0),
                cumulativePoints,
                raceName: item.raceName
              };
            }),
            racePositions: statsData.racePositions.map(item => ({
              round: Number(item.round),
              position: Number(item.position || 20),
              raceName: item.raceName
            })),
            stats: {
              wins: statsData.stats?.wins || 0,
              podiums: statsData.stats?.podiums || 0,
              dnf: statsData.stats?.dnf || 0,
              championship_position: statsData.stats?.championship_position || '-'
            },
            qualifyingVsRace: statsData.qualifyingVsRace.map(item => ({
              round: Number(item.round),
              qualifying_position: Number(item.qualifying_position || 20),
              race_position: Number(item.race_position || 20),
              raceName: item.raceName,
              performance: item.performance,
              positions_gained: Number(item.qualifying_position) - Number(item.race_position)
            })),
            teammateComparison: (() => {
              // Group by round
              const byRound = statsData.teammateComparison.reduce((acc, item) => {
                acc[item.round] = acc[item.round] || {
                  round: Number(item.round),
                  raceName: item.raceName
                };
                acc[item.round][item.driver_code] = Number(item.position);
                return acc;
              }, {});

              // Get unique driver codes, ensuring selected driver is first
              const driverCodes = [...new Set(statsData.teammateComparison.map(item => item.driver_code))];
              const selectedDriverCode = statsData.teammateComparison.find(item => item.driver_id === selectedDriver)?.driver_code;
              
              // Sort drivers so selected driver is first
              const sortedDriverCodes = [
                selectedDriverCode,
                ...driverCodes.filter(code => code !== selectedDriverCode)
              ].filter(Boolean); // Remove any undefined values

              // Take only first 2-3 drivers (depending on team)
              const finalDriverCodes = sortedDriverCodes.slice(0, 3);

              return {
                data: Object.values(byRound),
                drivers: finalDriverCodes
              };
            })()
          };
          setDriverStats(processedData);

          // Find min and max positions gained/lost
          const positionsGainedData = statsData.qualifyingVsRace.map(item => 
            Number(item.qualifying_position) - Number(item.race_position)
          );
          const maxGained = Math.max(...positionsGainedData);
          const minGained = Math.min(...positionsGainedData);
          
          // Add 2 positions padding to the range and round to nearest 5
          const maxPadded = Math.ceil((maxGained + 2) / 5) * 5;
          const minPadded = Math.floor((minGained - 2) / 5) * 5;
          
          setPositionsRange({ min: minPadded, max: maxPadded });

          setQualifyingResults(qualifyingData);
          setRaceResults(raceData);
          setDriverProfile(profileData);

          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
          setLoading(false);
          setDriverStats({
            pointsProgression: [],
            racePositions: []
          });
          setQualifyingResults([]);
          setRaceResults([]);
        });
    }
  }, [selectedDriver]);

  const selectedDriverName = drivers.find(d => d.driverId === selectedDriver)?.name;

  // Calculate overview stats
  const totalPoints = driverStats?.pointsProgression.reduce((sum, item) => sum + item.points, 0) || 0;
  const bestPosition = driverStats?.racePositions.reduce((best, item) => 
    item.position > 0 ? Math.min(best, item.position) : best, 20) || '-';
  const racesCompleted = driverStats?.racePositions.filter(item => item.position > 0).length || 0;
  const averagePosition = driverStats?.racePositions
    .filter(item => item.position > 0)
    .reduce((sum, item, _, arr) => sum + item.position / arr.length, 0)
    .toFixed(1) || '-';

  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      <div className="flex-1 space-y-8 p-8 pt-6 bg-white">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Driver Analytics</h2>
            <p className="text-muted-foreground">
              Detailed performance analysis for Formula 1 drivers
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="w-[200px] bg-transparent text-white border-white">
                <SelectValue placeholder="Select Driver">
                  {selectedDriverName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 text-white max-h-[200px] overflow-y-auto">
                {drivers.map(driver => (
                  <SelectItem key={driver.driverId} value={driver.driverId} className="hover:bg-zinc-800 focus:bg-zinc-800">
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)] bg-white">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-8 bg-white">
            {/* Driver Profile Card */}
            <div className="mb-6">
              <Card className="w-full">
                <div className="p-4">
                  {/* Content */}
                  <div className="flex items-start">
                    {/* Left Section - Driver Image */}
                    <div className="flex-shrink-0 mr-6">
                      <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-gray-100 shadow-lg">
                        <img
                          src={`/driver-images/${driverProfile?.code?.toLowerCase()}.png`}
                          alt={driverProfile ? `${driverProfile.forename} ${driverProfile.surname}` : 'Driver'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.parentElement.innerHTML = `<div class="flex items-center justify-center w-full h-full bg-gray-200 text-2xl font-bold text-gray-400">${driverProfile?.code || '?'}</div>`;
                          }}
                        />
                      </div>
                    </div>

                    {/* Middle Section - Driver Info */}
                    <div className="flex-grow">
                      <div className="flex items-start justify-between">
                        <div>
                          {/* Driver Name and Number */}
                          <div className="flex items-center space-x-3">
                            <h2 className="text-2xl font-bold text-gray-900">
                              {driverProfile ? `${driverProfile.forename} ${driverProfile.surname}` : ''}
                            </h2>
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-lg font-bold bg-red-100 text-red-800">
                              #{driverProfile?.number || ''}
                            </span>
                          </div>

                          {/* Driver Code and Nationality */}
                          <div className="flex items-center mt-2 space-x-6">
                            <span className="text-xl font-bold text-gray-500">
                              {driverProfile?.code || ''}
                            </span>
                            <div className="flex items-center space-x-2">
                              <img
                                src={`https://flagcdn.com/w40/${driverProfile?.nationality?.toLowerCase().slice(0, 2)}.png`}
                                alt={driverProfile?.nationality}
                                className="h-5 rounded shadow-sm"
                              />
                              <span className="text-sm text-gray-600 font-medium">
                                {driverProfile?.nationality || ''}
                              </span>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="mt-2">
                            <div className="text-xs text-gray-500">Date of Birth</div>
                            <div className="text-sm font-medium text-gray-900">
                              {driverProfile ? new Date(driverProfile.dob).toLocaleDateString() : ''}
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Team Info */}
                        <div className="text-right flex flex-col items-end">
                          <div className="h-24 w-64 flex items-center justify-end">
                            {driverProfile?.constructor_name ? (
                              <img
                                src={`/team-logos/${driverProfile.constructor_name.toLowerCase()
                                  .replace(/\s+f1\s+team/i, '')  // Remove "F1 Team" from names
                                  .replace(/\s+/g, '-')  // Replace spaces with hyphens
                                  .trim()}.png`}
                                alt={driverProfile.constructor_name}
                                className="h-full object-contain"
                                onError={(e) => {
                                  e.target.parentElement.innerHTML = `<div class="text-lg font-bold text-gray-800">${driverProfile.constructor_name}</div>`;
                                }}
                              />
                            ) : (
                              <div className="h-24 w-64 bg-gray-100 rounded animate-pulse" />
                            )}
                          </div>
                          <a
                            href={driverProfile?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Wikipedia
                            <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 bg-white">
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPoints}</div>
                  <p className="text-xs text-muted-foreground">
                    Championship points
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Best Position</CardTitle>
                  <Flag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">P{bestPosition}</div>
                  <p className="text-xs text-muted-foreground">
                    Season's best finish
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Race Wins</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{driverStats?.stats?.wins || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Race victories
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Podium Finishes</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{driverStats?.stats?.podiums || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Top 3 finishes
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Championship Position</CardTitle>
                  <Medal className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">P{driverStats?.stats?.championship_position || '-'}</div>
                  <p className="text-xs text-muted-foreground">
                    Current standing
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 bg-white">
              {/* Points Progression Chart */}
              <Card className="col-span-1 bg-white">
                <CardHeader>
                  <CardTitle>Points Progression</CardTitle>
                  <CardDescription>Championship points throughout the season</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[calc(100vh-550px)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={driverStats.pointsProgression}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="round" 
                          label={{ position: 'insideBottom', offset: -5 }}
                          interval={3}
                          tickFormatter={(value) => `R${value}`}
                        />
                        <YAxis 
                          label={{ value: 'Points', angle: -90, position: 'insideLeft' }}
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
                                      <span className="ml-auto text-xs font-mono">{data.race_points}</span>
                                    </div>
                                    {data.sprint_points > 0 && (
                                      <div className="flex items-center gap-2">
                                        <div className="h-2.5 w-2.5 rounded-[2px] bg-[#9333ea]" />
                                        <span className="text-xs">Sprint Points</span>
                                        <span className="ml-auto text-xs font-mono">{data.sprint_points}</span>
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
                          wrapperStyle={{ outline: 'none' }}
                          contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="cumulativePoints"
                          stroke="#e00400"
                          strokeWidth={2}
                          name="Total Points"
                          dot={<CustomDot />}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Positions Gained/Lost Chart */}
              <Card className="col-span-1 bg-white">
                <CardHeader>
                  <CardTitle>Positions Gained/Lost</CardTitle>
                  <CardDescription>Positions gained or lost from qualifying to race</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[calc(100vh-550px)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={driverStats.qualifyingVsRace}
                        margin={{
                          top: 20,
                          right: 20,
                          bottom: 20,
                          left: 20,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="round"
                          tickLine={false}
                          axisLine={false}
                          interval={3}
                          tickFormatter={(value) => `R${value}`}
                        />
                        <YAxis
                          domain={[positionsRange.min, positionsRange.max]}
                          label={{ value: 'Positions Gained/Lost', angle: -90, position: 'insideLeft' }}
                          ticks={Array.from(
                            { length: Math.floor((positionsRange.max - positionsRange.min) / 5) + 1 },
                            (_, i) => positionsRange.min + i * 5
                          )}
                        />
                        <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
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
                                      <span className="text-xs">Qualifying</span>
                                      <span className="ml-auto text-xs font-mono">P{data.qualifying_position}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="h-2.5 w-2.5 rounded-[2px] bg-[#22c55e]" />
                                      <span className="text-xs">Race</span>
                                      <span className="ml-auto text-xs font-mono">P{data.race_position}</span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1.5 mt-1.5 border-t border-white/20">
                                      <span className="text-xs font-medium">Positions Gained/Lost</span>
                                      <span className="ml-auto text-xs font-mono">{data.positions_gained > 0 ? `+${data.positions_gained}` : `${data.positions_gained}`}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                          wrapperStyle={{ outline: 'none' }}
                          contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                        />
                        <Bar
                          dataKey="positions_gained"
                          radius={8}
                        >
                          <LabelList
                            dataKey="positions_gained"
                            position="top"
                            offset={12}
                            className="fill-white"
                            fontSize={12}
                            formatter={(value) => (value > 0 ? `+${value}` : value)}
                          />
                          {driverStats.qualifyingVsRace?.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.positions_gained > 0 ? '#22c55e' : '#ef4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Race Positions Chart */}
              <Card className="col-span-1 bg-white">
                <CardHeader>
                  <CardTitle>Race Positions</CardTitle>
                  <CardDescription>Finishing positions for each race</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[calc(100vh-550px)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={driverStats.racePositions}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="round"
                          label={{ position: 'insideBottom', offset: -5 }}
                          interval={3}
                          tickFormatter={(value) => `R${value}`}
                        />
                        <YAxis
                          reversed
                          domain={[1, 20]}
                          label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20 shadow-xl">
                                  <p className="text-sm font-medium mb-2">{data.raceName}</p>
                                  <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-[2px] bg-[#e00400]" />
                                    <span className="text-xs">Position</span>
                                    <span className="ml-auto text-xs font-mono">P{data.position}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                          wrapperStyle={{ outline: 'none' }}
                          contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="position"
                          stroke="#e00400"
                          strokeWidth={2}
                          name="Position"
                          dot
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Teammate Comparison Chart */}
              <Card className="col-span-1 bg-white">
                <CardHeader>
                  <CardTitle>Teammate Comparison</CardTitle>
                  <CardDescription>Race positions compared to teammate throughout the season</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[calc(100vh-550px)]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={driverStats.teammateComparison.data}
                        margin={{
                          top: 20,
                          right: 20,
                          bottom: 20,
                          left: 20,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="round"
                          tickLine={false}
                          axisLine={false}
                          interval={3}
                          tickFormatter={(value) => `R${value}`}
                        />
                        <YAxis
                          reversed
                          domain={[1, 20]}
                          ticks={[1, 5, 10, 15, 20]}
                          tickLine={false}
                          axisLine={false}
                          label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20 shadow-xl">
                                  <p className="text-sm font-medium mb-2">{data.raceName}</p>
                                  <div className="space-y-1">
                                    {driverStats.teammateComparison.drivers.map((code, index) => (
                                      data[code] && (
                                        <div key={code} className="flex items-center gap-2">
                                          <div
                                            className="h-2.5 w-2.5 rounded-[2px]"
                                            style={{ backgroundColor: index === 0 ? '#e00400' : index === 1 ? '#9333ea' : '#22c55e' }}
                                          />
                                          <span className="text-xs">{code}</span>
                                          <span className="ml-auto text-xs font-mono">P{data[code]}</span>
                                        </div>
                                      )
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                          wrapperStyle={{ outline: 'none' }}
                          contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                        />
                        {driverStats.teammateComparison.drivers.map((code, index) => (
                          <Line
                            key={code}
                            type="monotone"
                            dataKey={code}
                            stroke={index === 0 ? '#e00400' : index === 1 ? '#9333ea' : '#22c55e'}
                            strokeWidth={2}
                            dot={{
                              r: 3,
                              strokeWidth: 2,
                              fill: "white"
                            }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Tables */}
            <div className="mt-8">
              <button
                onClick={() => setShowResults(!showResults)}
                className="w-full flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-gray-500" />
                  <h3 className="text-lg font-semibold">Session Results</h3>
                </div>
                {showResults ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {showResults && (
                <div className="mt-4 bg-white rounded-lg shadow overflow-hidden">
                  {/* Tabs */}
                  <div className="border-b border-gray-200 p-4">
                    <div className="relative flex items-center p-0.5 rounded-[--radius] w-[300px] bg-[#f4f4f5]">
                      <div
                        className="absolute h-full top-0 transition-transform duration-200 ease-in-out rounded-[--radius]"
                        style={{
                          width: '50%',
                          transform: `translateX(${activeTab === 'race' ? '0%' : '100%'})`,
                          backgroundColor: '#ffffff'
                        }}
                      />
                      <button
                        onClick={() => setActiveTab('race')}
                        style={{
                          color: activeTab === 'race' ? '#ffffff' : '#71717a'
                        }}
                        className="relative flex-1 px-3 py-1.5 text-sm font-medium rounded-[--radius] transition-colors duration-200 focus:outline-none"
                      >
                        Race Results
                      </button>
                      <button
                        onClick={() => setActiveTab('qualifying')}
                        style={{
                          color: activeTab === 'qualifying' ? '#ffffff' : '#71717a'
                        }}
                        className="relative flex-1 px-3 py-1.5 text-sm font-medium rounded-[--radius] transition-colors duration-200 focus:outline-none"
                      >
                        Qualifying Results
                      </button>
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
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grid</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fastest Lap</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {raceResults.map((result, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">R{result.round}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{result.race_name}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                <span className="text-gray-500">P{result.grid}</span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  result.position <= 3 ? 'bg-green-100 text-green-800' : 
                                  result.position <= 10 ? 'bg-blue-100 text-blue-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  P{result.position}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{result.points}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  result.status === 'Finished' ? 'bg-green-100 text-green-800' : 
                                  result.status.startsWith('+') ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {result.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-900">{result.time || '-'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {result.fastest_lap_time ? (
                                  <div>
                                    {result.fastest_lap === 1 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        FL
                                      </span>
                                    )}
                                    <span className="text-xs font-mono text-gray-500 ml-1">{result.fastest_lap_time}</span>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{result.constructor_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Race</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q1</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q2</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q3</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {qualifyingResults.map((result, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">R{result.round}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{result.race_name}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  result.position <= 3 ? 'bg-green-100 text-green-800' : 
                                  result.position <= 10 ? 'bg-blue-100 text-blue-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  P{result.position}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">{result.q1_time || '-'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">{result.q2_time || '-'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">{result.q3_time || '-'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{result.constructor_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
