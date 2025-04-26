import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsDisplayProps {
  analytics: {
    totalInteractions: number;
    dailyStats: Array<{
      date: string;
      count: number;
    }>;
    botAnalytics: Array<{
      botId: string;
      botName: string;
      totalInteractions: number;
      successRate: number;
      avgProcessingTime: number;
      lastInteraction: string;
    }>;
  };
}

export const AnalyticsDisplay: React.FC<AnalyticsDisplayProps> = ({ analytics }) => {
  if (!analytics) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Interactions</CardTitle>
          <CardDescription>Across all your bots</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalInteractions}</div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Daily Usage</CardTitle>
          <CardDescription>Interaction trends over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {analytics.botAnalytics.map((bot) => (
        <Card key={bot.botId}>
          <CardHeader>
            <CardTitle>{bot.botName}</CardTitle>
            <CardDescription>Bot Performance Metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Total Interactions:</span> {bot.totalInteractions}
              </div>
              <div>
                <span className="font-medium">Success Rate:</span> {(bot.successRate * 100).toFixed(1)}%
              </div>
              <div>
                <span className="font-medium">Avg. Processing Time:</span> {bot.avgProcessingTime.toFixed(2)}ms
              </div>
              <div>
                <span className="font-medium">Last Interaction:</span>{' '}
                {new Date(bot.lastInteraction).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnalyticsDisplay; 