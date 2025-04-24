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

      const [hours, minutes] = selectedTime.split(":").map(Number);
      const nextRunDate = selectedDate || new Date();
      nextRunDate.setHours(hours, minutes, 0, 0);

      await axios.post(
        `${serverURL}/api/scraper-schedules`,
        {
          ...newSchedule,
          nextRun: nextRunDate.toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchSchedules();
      setNewSchedule({
        name: "",
        url: "",
        schedule: "daily",
        customSchedule: "",
        nextRun: new Date().toISOString(),
      });
      setSelectedDate(new Date());
      setSelectedTime("00:00");
    } catch (error) {
      console.error("Failed to create schedule", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/login");
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
      await axios.patch(
        `${serverURL}/api/scraper-schedules/${id}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchSchedules();
    } catch (error) {
      console.error("Failed to toggle schedule", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/login");
      }
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
      fetchSchedules();
      if (selectedSchedule?._id === id) {
        setSelectedSchedule(null);
        setScrapes([]);
      }
    } catch (error) {
      console.error("Failed to delete schedule", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push("/login");
      }
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
      fetchScheduleDetails(id);
    } catch (error) {
      console.error("Failed to execute scraping", error);
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs defaultValue="schedules">
        <TabsList>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="create">Create Schedule</TabsTrigger>
        </TabsList>
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Your Scraper Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <Card key={schedule._id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{schedule.name}</h3>
                          <p className="text-sm text-muted-foreground">{schedule.url}</p>
                          <p className="text-sm">
                            Schedule: {schedule.schedule}
                            {schedule.customSchedule && ` (${schedule.customSchedule})`}
                          </p>
                          <p className="text-sm">
                            Next Run: {format(new Date(schedule.nextRun), "PPP p")}
                          </p>
                          {schedule.lastRun && (
                            <p className="text-sm">
                              Last Run: {format(new Date(schedule.lastRun), "PPP p")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExecuteScraping(schedule._id)}
                            disabled={executing === schedule._id}
                          >
                            {executing === schedule._id ? "Executing..." : "Execute Now"}
                          </Button>
                          <Switch
                            checked={schedule.isActive}
                            onCheckedChange={() => handleToggleSchedule(schedule._id)}
                            className={cn(
                              schedule.isActive ? "bg-green-500" : "bg-red-500"
                            )}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => fetchScheduleDetails(schedule._id)}
                      >
                        View Scraping History
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedSchedule && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Scraping History for {selectedSchedule.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {scrapes.map((scrape) => (
                      <Card key={scrape._id}>
                        <CardContent className="p-4">
                          <div>
                            <h4 className="font-semibold">{scrape.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Created: {format(new Date(scrape.createdAt), "PPP p")}
                            </p>
                            <p className="text-sm">URL: {scrape.url}</p>
                            <p className="text-sm">QA Pairs: {scrape.qaPairs.length}</p>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => window.open(scrape.s3FileUrl, "_blank")}
                            >
                              View Results
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Scraper Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  placeholder="Enter schedule name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={newSchedule.url}
                  onChange={(e) => setNewSchedule({ ...newSchedule, url: e.target.value })}
                  placeholder="Enter URL to scrape"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule</Label>
                <Select
                  value={newSchedule.schedule}
                  onValueChange={(value) => setNewSchedule({ ...newSchedule, schedule: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800">
                    <SelectItem value="daily" className="hover:bg-gray-100 dark:hover:bg-gray-700">Daily</SelectItem>
                    <SelectItem value="weekly" className="hover:bg-gray-100 dark:hover:bg-gray-700">Weekly</SelectItem>
                    <SelectItem value="monthly" className="hover:bg-gray-100 dark:hover:bg-gray-700">Monthly</SelectItem>
                    <SelectItem value="custom" className="hover:bg-gray-100 dark:hover:bg-gray-700">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newSchedule.schedule === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customSchedule">Custom Schedule (Cron Expression)</Label>
                  <Input
                    id="customSchedule"
                    value={newSchedule.customSchedule}
                    onChange={(e) => setNewSchedule({ ...newSchedule, customSchedule: e.target.value })}
                    placeholder="Enter cron expression (e.g., 0 0 * * *)"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Next Run</Label>
                <div className="flex flex-col space-y-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[280px] justify-start text-left font-normal bg-white dark:bg-gray-800",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "MMMM d, yyyy") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className="rounded-md border shadow-md bg-white dark:bg-gray-800"
                        weekStartsOn={1}
                        formatters={{
                          formatWeekdayName: () => ""
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="time">Time:</Label>
                    <Input
                      id="time"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleCreateSchedule} disabled={loading} className="text-black">
                {loading ? "Creating..." : "Create Schedule"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}