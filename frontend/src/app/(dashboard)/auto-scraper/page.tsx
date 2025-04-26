"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import axios from "axios";
import { serverURL } from "@/utils/utils";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { TrashIcon, PlayIcon, DownloadIcon } from "lucide-react";

interface ScraperSchedule {
  _id: string;
  name: string;
  url: string;
  schedule: string;
  customSchedule?: string;
  nextRun: string;
  isActive: boolean;
  lastRun?: string;
}

interface Scrape {
  _id: string;
  name: string;
  url: string;
  createdAt: string;
  s3FileUrl: string;
  sourceType: string;
  qaPairs: Array<{ question: string; answer: string }>;
}

export default function AutoScraperPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ScraperSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScraperSchedule | null>(null);
  const [scrapes, setScrapes] = useState<Scrape[]>([]);
  const [newSchedule, setNewSchedule] = useState({
    name: "",
    url: "",
    schedule: "daily",
    customSchedule: "",
    nextRun: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("00:00");
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchSchedules();
  }, [router]);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await axios.get(`${serverURL}/api/scraper-schedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedules(response.data);
    } catch (error) {
      console.error("Failed to fetch schedules", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/login");
      }
    }
  };

  const fetchScheduleDetails = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await axios.get(`${serverURL}/api/scraper-schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedSchedule(response.data.schedule);
      setScrapes(response.data.scrapes);
    } catch (error) {
      console.error("Failed to fetch schedule details", error);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Validate URL
      if (!newSchedule.url.startsWith('http://') && !newSchedule.url.startsWith('https://')) {
        throw new Error('Please enter a valid URL starting with http:// or https://');
      }

      // Combine date and time for nextRun
      const [hours, minutes] = selectedTime.split(':');
      const nextRunDate = new Date(selectedDate || new Date());
      nextRunDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Format the nextRun date for display
      const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      const formattedDate = format(nextRunDate, 'yyyy-MM-dd');
      console.log(`Creating schedule with next run time: ${formattedDate} ${formattedTime}`);

      const response = await axios.post(
        `${serverURL}/api/scraper-schedules`,
        {
          ...newSchedule,
          nextRun: nextRunDate.toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSchedules([...schedules, response.data]);
      setNewSchedule({
        name: "",
        url: "",
        schedule: "daily",
        customSchedule: "",
        nextRun: new Date().toISOString(),
      });
      
      // Reset time to current time
      const now = new Date();
      setSelectedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    } catch (error) {
      console.error("Failed to create schedule", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Failed to create schedule");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSchedule = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const schedule = schedules.find(s => s._id === id);
      if (!schedule) return;

      const response = await axios.patch(
        `${serverURL}/api/scraper-schedules/${id}/toggle`,
        { isActive: !schedule.isActive },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSchedules(schedules.map(s => 
        s._id === id ? { ...s, isActive: !s.isActive } : s
      ));
    } catch (error) {
      console.error("Failed to toggle schedule", error);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      await axios.delete(`${serverURL}/api/scraper-schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSchedules(schedules.filter(s => s._id !== id));
      if (selectedSchedule?._id === id) {
        setSelectedSchedule(null);
        setScrapes([]);
      }
    } catch (error) {
      console.error("Failed to delete schedule", error);
    }
  };

  const handleExecuteScraping = async (id: string) => {
    try {
      setExecuting(id);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      await axios.post(
        `${serverURL}/api/scraper-schedules/${id}/execute`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh the schedule details
      await fetchScheduleDetails(id);
    } catch (error) {
      console.error("Failed to execute scraping", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Failed to execute scraping");
      }
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="container mx-auto py-8 dark:bg-gray-950 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Auto Scraper</h1>
        <Button
          onClick={() => router.push('/scraper')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          View Auto Scrapes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create New Schedule */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Create New Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Schedule Name</Label>
              <Input
                id="name"
                value={newSchedule.name}
                onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                placeholder="Enter schedule name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url" className="text-gray-300">URL to Scrape</Label>
              <Input
                id="url"
                value={newSchedule.url}
                onChange={(e) => setNewSchedule({ ...newSchedule, url: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                placeholder="Enter URL"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Schedule Type</Label>
              <Select
                value={newSchedule.schedule}
                onValueChange={(value) => setNewSchedule({ ...newSchedule, schedule: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select schedule type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="daily" className="text-gray-300 hover:bg-gray-800">Daily</SelectItem>
                  <SelectItem value="weekly" className="text-gray-300 hover:bg-gray-800">Weekly</SelectItem>
                  <SelectItem value="monthly" className="text-gray-300 hover:bg-gray-800">Monthly</SelectItem>
                  <SelectItem value="custom" className="text-gray-300 hover:bg-gray-800">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newSchedule.schedule === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customSchedule" className="text-gray-300">Custom Schedule (Cron Expression)</Label>
                <Input
                  id="customSchedule"
                  value={newSchedule.customSchedule}
                  onChange={(e) => setNewSchedule({ ...newSchedule, customSchedule: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                  placeholder="Enter cron expression"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-gray-300">Next Run</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-800">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="bg-gray-900 text-white"
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <Button
              onClick={handleCreateSchedule}
              disabled={loading}
              className="w-full bg-black hover:bg-white text-white hover:text-black border border-black hover:border-black"
            >
              {loading ? "Creating..." : "Create Schedule"}
            </Button>
          </CardContent>
        </Card>

        {/* Schedules List */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Your Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div
                    key={schedule._id}
                    className="p-4 border border-gray-800 rounded-lg bg-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">{schedule.name}</h3>
                        <p className="text-sm text-gray-400">{schedule.url}</p>
                        <p className="text-sm text-gray-400">
                          Next run: {new Date(schedule.nextRun).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={schedule.isActive}
                          onCheckedChange={() => handleToggleSchedule(schedule._id)}
                          className={schedule.isActive ? "bg-green-500" : "bg-red-500"}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSchedule(schedule._id)}
                          className="text-gray-300 hover:text-red-500 hover:bg-gray-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExecuteScraping(schedule._id)}
                          className="text-gray-300 hover:text-green-500 hover:bg-gray-700"
                          disabled={!!executing}
                        >
                          <PlayIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Selected Schedule Details */}
      {selectedSchedule && (
        <Card className="mt-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Schedule Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="scrapes" className="w-full">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="scrapes" className="text-gray-300 data-[state=active]:text-white">
                  Scrapes
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-gray-300 data-[state=active]:text-white">
                  Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="scrapes">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {scrapes.map((scrape) => (
                      <div
                        key={scrape._id}
                        className="p-4 border border-gray-800 rounded-lg bg-gray-800"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-white">{scrape.name}</h3>
                            <p className="text-sm text-gray-400">
                              Created: {new Date(scrape.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(scrape.s3FileUrl, '_blank')}
                            className="text-gray-300 hover:text-white hover:bg-gray-700"
                          >
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="settings">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Schedule Type</Label>
                    <p className="text-sm text-gray-400">{selectedSchedule.schedule}</p>
                  </div>
                  {selectedSchedule.customSchedule && (
                    <div className="space-y-2">
                      <Label className="text-gray-300">Custom Schedule</Label>
                      <p className="text-sm text-gray-400">{selectedSchedule.customSchedule}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Next Run</Label>
                    <p className="text-sm text-gray-400">
                      {new Date(selectedSchedule.nextRun).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Last Run</Label>
                    <p className="text-sm text-gray-400">
                      {selectedSchedule.lastRun
                        ? new Date(selectedSchedule.lastRun).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}