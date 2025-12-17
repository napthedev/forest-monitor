"use client";

import { useEffect, useState } from "react";
import { database } from "@/lib/firebase";
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  onValue,
} from "firebase/database";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Header from "@/components/Header";
import {
  formatRelativeTime,
  formatTime,
  getHumidityDescription,
  getHumidityGradientColor,
} from "@/lib/utils";
import { Droplets } from "lucide-react";

interface SensorData {
  timestamp: string;
  value: number;
}

export default function HumiditySensorPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [currentHumidity, setCurrentHumidity] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState<
    number | null
  >(null);
  const [relativeTimeText, setRelativeTimeText] = useState<string>("");

  // Update relative time text every second
  useEffect(() => {
    if (lastUpdatedTimestamp === null) return;

    const updateRelativeTime = () => {
      setRelativeTimeText(formatRelativeTime(lastUpdatedTimestamp));
    };

    // Update immediately
    updateRelativeTime();

    // Update every second
    const interval = setInterval(updateRelativeTime, 1000);

    return () => clearInterval(interval);
  }, [lastUpdatedTimestamp]);

  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/humidity");
    const sensorsQuery = query(
      sensorsRef,
      orderByChild("timestamp"),
      limitToLast(20)
    );

    const unsubscribe = onValue(sensorsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData: SensorData[] = Object.entries(data).map(
          ([, record]) => {
            const { timestamp, value } = record as {
              timestamp: number;
              value: number;
            };
            return {
              timestamp: String(timestamp),
              value,
            };
          }
        );

        // Sort by timestamp
        formattedData.sort(
          (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
        );

        setSensorData(formattedData);
        if (formattedData.length > 0) {
          const latestData = formattedData[formattedData.length - 1];
          setCurrentHumidity(latestData.value);
          setLastUpdatedTimestamp(parseInt(latestData.timestamp));
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Forest Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMzAgNUwzNSAxNUwyNSAxNVoiIGZpbGw9IiMwMDAwMDAiIG9wYWNpdHk9IjAuMyIvPgo8cGF0aCBkPSJNMzAgMjBMMzggMzVIMjJaIiBmaWxsPSIjMDAwMDAwIiBvcGFjaXR5PSIwLjMiLz4KPHBhdGggZD0iTTMwIDM1TDQwIDU1SDIwWiIgZmlsbD0iIzAwMDAwMCIgb3BhY2l0eT0iMC4zIi8+Cjwvc3ZnPg==')] bg-repeat" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-sky-600/20 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-cyan-600/15 rounded-full animate-pulse delay-300" />
        <div className="absolute top-2/3 left-1/2 w-2 h-2 bg-sky-600/20 rounded-full animate-pulse delay-700" />
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-cyan-500/10 rounded-full animate-pulse delay-500" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Droplets className="w-12 h-12 text-sky-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-sky-500 via-cyan-400 to-blue-400">
              Humidity Sensor
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Real-time humidity monitoring (DHT11)
          </p>
        </header>

        {/* Current Reading Card */}
        <div className="mb-8">
          <div className="bg-linear-to-br from-sky-50 to-cyan-50 rounded-3xl p-8 border border-sky-200 shadow-lg shadow-sky-100/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-sky-700 text-sm uppercase tracking-widest mb-2">
                  Current Humidity
                </h2>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-16 w-32 bg-sky-200 rounded-lg" />
                  </div>
                ) : (
                  <>
                    <div
                      className={`text-6xl md:text-7xl font-bold bg-linear-to-r ${getHumidityGradientColor(
                        currentHumidity
                      )} bg-clip-text text-transparent`}
                    >
                      {currentHumidity !== null ? `${currentHumidity}%` : "—"}
                    </div>
                    <div className="text-sky-700 text-xl mt-2 flex items-center gap-2 justify-center md:justify-start">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          currentHumidity !== null && currentHumidity > 75
                            ? "bg-blue-500"
                            : "bg-sky-400"
                        } animate-pulse`}
                      />
                      {getHumidityDescription(currentHumidity)}
                    </div>
                    {relativeTimeText && (
                      <div className="text-sky-500 text-sm mt-2 flex items-center gap-1 justify-center md:justify-start">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Updated {relativeTimeText}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Humidity Visual Indicator */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-32 h-32">
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="rgba(56, 189, 248, 0.15)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#humidityGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(currentHumidity || 0) * 2.51} 251`}
                      className="transition-all duration-500"
                    />
                    <defs>
                      <linearGradient
                        id="humidityGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="50%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Droplets
                      className={`w-10 h-10 ${
                        currentHumidity !== null && currentHumidity > 75
                          ? "text-blue-500"
                          : "text-sky-400"
                      } transition-colors duration-500`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-linear-to-br from-sky-50 to-cyan-50 rounded-3xl p-6 md:p-8 border border-sky-200 shadow-lg shadow-sky-100/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center gap-3">
              <svg
                className="w-6 h-6 text-sky-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Humidity History
            </h2>
            <span className="text-sky-600/70 text-sm">
              Last {sensorData.length} readings
            </span>
          </div>

          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-400 rounded-full animate-spin" />
                <span className="text-sky-600">Loading sensor data...</span>
              </div>
            </div>
          ) : sensorData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-lg">No sensor data available</p>
                <p className="text-sm mt-2">
                  Waiting for data from the humidity sensor...
                </p>
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sensorData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorHumidity"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                      <stop
                        offset="50%"
                        stopColor="#22d3ee"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="#60a5fa"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(56, 189, 248, 0.2)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTime}
                    stroke="#38bdf8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(56, 189, 248, 0.4)" }}
                    tick={{ fill: "#38bdf8" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#38bdf8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(56, 189, 248, 0.4)" }}
                    tick={{ fill: "#38bdf8" }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ color: "#374151", fontWeight: 600 }}
                    itemStyle={{ color: "#38bdf8" }}
                    formatter={(value: number | undefined) => [
                      value == null ? "N/A" : `${value}%`,
                      "Humidity",
                    ]}
                    labelFormatter={(label) => formatTime(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    fill="url(#colorHumidity)"
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: "#38bdf8",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {sensorData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-linear-to-br from-sky-50 to-cyan-50 rounded-2xl p-6 border border-sky-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-amber-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 8L6 14H18L12 8Z" />
                </svg>
                <span className="text-sky-700 text-sm uppercase tracking-wide">
                  Minimum
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {Math.min(...sensorData.map((d) => d.value))}%
              </div>
            </div>
            <div className="bg-linear-to-br from-sky-50 to-cyan-50 rounded-2xl p-6 border border-sky-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-sky-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M4 12H20"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-sky-700 text-sm uppercase tracking-wide">
                  Average
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {(
                  sensorData.reduce((acc, d) => acc + d.value, 0) /
                  sensorData.length
                ).toFixed(1)}
                %
              </div>
            </div>
            <div className="bg-linear-to-br from-sky-50 to-cyan-50 rounded-2xl p-6 border border-sky-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 16L6 10H18L12 16Z" />
                </svg>
                <span className="text-sky-700 text-sm uppercase tracking-wide">
                  Maximum
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {Math.max(...sensorData.map((d) => d.value))}%
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>🌲 Forest Monitor • Real-time environmental sensing</p>
        </footer>
      </main>
    </div>
  );
}
