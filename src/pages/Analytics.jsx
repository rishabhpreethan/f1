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
  Cell
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Trophy, Flag, Timer, TrendingUp } from "lucide-react";

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
  const [loading, setLoading] = useState(true);

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
      fetch(`http://localhost:3001/api/driver-stats/${selectedDriver}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Received data:', data);
          if (!data.pointsProgression || !data.racePositions) {
            throw new Error('Invalid data format received');
          }
          // Process the data to ensure numbers and calculate cumulative points
          const processedData = {
            pointsProgression: data.pointsProgression.map((item, index, arr) => {
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
            racePositions: data.racePositions.map(item => ({
              round: Number(item.round),
              position: Number(item.position || 20),
              raceName: item.raceName
            })),
            stats: {
              wins: data.stats?.wins || 0,
              podiums: data.stats?.podiums || 0,
              dnf: data.stats?.dnf || 0
            },
            qualifyingVsRace: data.qualifyingVsRace.map(item => ({
              round: Number(item.round),
              qualifying_position: Number(item.qualifying_position || 20),
              race_position: Number(item.race_position || 20),
              raceName: item.raceName,
              performance: item.performance,
              positions_gained: Number(item.race_position) - Number(item.qualifying_position)
            })),
            teammateComparison: (() => {
              // Group by round
              const byRound = data.teammateComparison.reduce((acc, item) => {
                acc[item.round] = acc[item.round] || {
                  round: Number(item.round),
                  raceName: item.raceName
                };
                acc[item.round][item.driver_code] = Number(item.position);
                return acc;
              }, {});

              // Get unique driver codes, ensuring selected driver is first
              const driverCodes = [...new Set(data.teammateComparison.map(item => item.driver_code))];
              const selectedDriverCode = data.teammateComparison.find(item => item.driver_id === selectedDriver)?.driver_code;
              
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
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching driver stats:', error);
          setLoading(false);
          setDriverStats({
            pointsProgression: [],
            racePositions: []
          });
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
    <div className="flex flex-col min-h-screen w-screen bg-background">
      <div className="flex-1 w-full p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between mb-8 w-full max-w-[2000px] mx-auto">
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
          <div className="flex justify-center items-center h-[400px]">
            <p>Loading driver statistics...</p>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 w-full max-w-[2000px] mx-auto">
              <Card>
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Best Position</CardTitle>
                  <Flag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bestPosition}</div>
                  <p className="text-xs text-muted-foreground">
                    Season's best finish
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Race Wins</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{driverStats.stats?.wins || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Race victories
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Podium Finishes</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{driverStats.stats?.podiums || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Top 3 finishes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 h-[calc(100vh-400px)] w-full max-w-[2000px] mx-auto">
              {/* Points Progression Chart */}
              <Card className="col-span-1">
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
                                    <div className="flex items-center gap-2">
                                      <div className="h-2.5 w-2.5 rounded-[2px] bg-[#9333ea]" />
                                      <span className="text-xs">Sprint Points</span>
                                      <span className="ml-auto text-xs font-mono">{data.sprint_points}</span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1.5 mt-1.5 border-t border-white/20">
                                      <span className="text-xs font-medium">Race Total</span>
                                      <span className="ml-auto text-xs font-mono">{data.points}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">Season Total</span>
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
                          dataKey="points"
                          stroke="#e00400"
                          strokeWidth={1}
                          name="Race Points"
                          dot={true}
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
              <Card className="col-span-1">
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
                        />
                        <YAxis 
                          domain={[20, -20]}
                          label={{ value: 'Positions Gained/Lost', angle: -90, position: 'insideLeft' }}
                          reversed
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const gained = data.positions_gained < 0;
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
                                      <span className="text-xs font-medium">{gained ? 'Positions Gained' : 'Positions Lost'}</span>
                                      <span className="ml-auto text-xs font-mono">{gained ? `+${Math.abs(data.positions_gained)}` : `-${data.positions_gained}`}</span>
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
                            formatter={(value) => (value < 0 ? `+${Math.abs(value)}` : `-${value}`)}
                          />
                          {driverStats.qualifyingVsRace?.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.positions_gained < 0 ? '#22c55e' : '#ef4444'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Teammate Comparison Chart */}
              <Card className="col-span-1">
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
                              r: 4,
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

              {/* Race Positions Chart */}
              <Card className="col-span-1">
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
                          dot={(props) => <PositionDot {...props} chartHeight={props.chartHeight} />}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;
