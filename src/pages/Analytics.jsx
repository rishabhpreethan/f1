import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Trophy, Flag, Timer, TrendingUp } from "lucide-react";

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
                cumulativePoints,
                raceName: item.raceName
              };
            }),
            racePositions: data.racePositions.map(item => ({
              round: Number(item.round),
              position: Number(item.position || 20),
              raceName: item.raceName
            }))
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
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Driver">
                  {selectedDriverName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {drivers.map(driver => (
                  <SelectItem key={driver.driverId} value={driver.driverId}>
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
                  <CardTitle className="text-sm font-medium">Races Completed</CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{racesCompleted}</div>
                  <p className="text-xs text-muted-foreground">
                    Out of {driverStats.racePositions.length} races
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Position</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averagePosition}</div>
                  <p className="text-xs text-muted-foreground">
                    Average race finish
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
                          label={{ value: 'Race', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          label={{ value: 'Points', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === "Race Points") return [value, name];
                            return [value, "Total Points"];
                          }}
                          labelFormatter={(label, items) => items[0]?.payload?.raceName || `Race ${label}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="points"
                          stroke="#666666"
                          strokeWidth={1}
                          name="Race Points"
                          dot={true}
                        />
                        <Line
                          type="monotone"
                          dataKey="cumulativePoints"
                          stroke="#000000"
                          strokeWidth={2}
                          name="Total Points"
                          dot={true}
                        />
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
                          label={{ value: 'Race', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          reversed 
                          domain={[1, 20]}
                          label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [value, name]}
                          labelFormatter={(label, items) => items[0]?.payload?.raceName || `Race ${label}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="position"
                          stroke="#000000"
                          strokeWidth={2}
                          name="Position"
                          dot={true}
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
