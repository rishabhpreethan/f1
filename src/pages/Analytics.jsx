import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, Trophy, Flag, Users, CalendarDays } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Sample data - will be replaced with real F1 data
const pointsProgressionData = [
  { race: "Bahrain", verstappen: 25, perez: 18, hamilton: 15 },
  { race: "Saudi Arabia", verstappen: 50, perez: 36, hamilton: 28 },
  { race: "Australia", verstappen: 69, perez: 54, hamilton: 43 },
  { race: "Azerbaijan", verstappen: 93, perez: 72, hamilton: 48 },
  { race: "Miami", verstappen: 119, perez: 87, hamilton: 56 },
];

const constructorData = [
  { name: "Red Bull Racing", points: 287 },
  { name: "Mercedes", points: 152 },
  { name: "Ferrari", points: 148 },
  { name: "McLaren", points: 120 },
  { name: "Aston Martin", points: 97 },
];

const chartConfig = {
  verstappen: {
    label: "Verstappen",
    color: "hsl(var(--primary))",
  },
  perez: {
    label: "Perez",
    color: "hsl(var(--secondary))",
  },
  hamilton: {
    label: "Hamilton",
    color: "hsl(var(--accent))",
  },
};

function Analytics() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">F1 Analytics Dashboard</h2>
      </div>
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Races</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1000+</div>
            <p className="text-xs text-muted-foreground">
              Since 1950
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">20</div>
            <p className="text-xs text-muted-foreground">
              2024 Season
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Circuits</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              Across the globe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Season</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2024</div>
            <p className="text-xs text-muted-foreground">
              March - December
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Points Progression</CardTitle>
            <CardDescription>
              Top drivers' championship points progression
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <AreaChart
                data={pointsProgressionData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                width={800}
                height={300}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="race" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="verstappen"
                  stackId="1"
                  stroke="#FF1E1E"
                  fill="#FF1E1E"
                  fillOpacity={0.3}
                  name="Verstappen"
                />
                <Area
                  type="monotone"
                  dataKey="perez"
                  stackId="2"
                  stroke="#3671C6"
                  fill="#3671C6"
                  fillOpacity={0.3}
                  name="Perez"
                />
                <Area
                  type="monotone"
                  dataKey="hamilton"
                  stackId="3"
                  stroke="#27F4D2"
                  fill="#27F4D2"
                  fillOpacity={0.3}
                  name="Hamilton"
                />
              </AreaChart>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Constructor Standings</CardTitle>
            <CardDescription>
              Current constructor championship standings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <BarChart
                data={constructorData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                width={400}
                height={300}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="points" fill="#8884d8" name="Points" />
              </BarChart>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Race Results</CardTitle>
          <CardDescription>Latest Grand Prix results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b">
                  <th className="h-12 px-4 text-left align-middle font-medium">Position</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Driver</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Team</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 align-middle">1</td>
                  <td className="p-4 align-middle">Max Verstappen</td>
                  <td className="p-4 align-middle">Red Bull Racing</td>
                  <td className="p-4 align-middle">25</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 align-middle">2</td>
                  <td className="p-4 align-middle">Lewis Hamilton</td>
                  <td className="p-4 align-middle">Mercedes</td>
                  <td className="p-4 align-middle">18</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 align-middle">3</td>
                  <td className="p-4 align-middle">Charles Leclerc</td>
                  <td className="p-4 align-middle">Ferrari</td>
                  <td className="p-4 align-middle">15</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Analytics;
