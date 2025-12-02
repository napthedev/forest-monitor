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

interface SensorData {
  timestamp: string;
  value: number;
  lightPercentage: number;
}

// Convert raw sensor value (0-4095) to percentage (0-100%)
// 0 = lightest (100%), 4095 = darkest (0%)
function convertToPercentage(rawValue: number): number {
  return Math.round(((4095 - rawValue) / 4095) * 100 * 10) / 10;
}

// Format timestamp for display
function formatTime(timestamp: string): string {
  const date = new Date(parseInt(timestamp));
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Home() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [currentLight, setCurrentLight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/light");
    const sensorsQuery = query(
      sensorsRef,
      orderByChild("timestamp"),
      limitToLast(20)
    );

    const unsubscribe = onValue(sensorsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData: SensorData[] = Object.entries(data).map(
          ([id, record]) => {
            const { timestamp, value } = record as {
              timestamp: number;
              value: number;
            };
            return {
              timestamp: String(timestamp),
              value,
              lightPercentage: convertToPercentage(value),
            };
          }
        );

        // Sort by timestamp
        formattedData.sort(
          (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
        );

        setSensorData(formattedData);
        if (formattedData.length > 0) {
          setCurrentLight(
            formattedData[formattedData.length - 1].lightPercentage
          );
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Determine light level description
  const getLightDescription = (percentage: number | null) => {
    if (percentage === null) return "Unknown";
    if (percentage < 20) return "Very Dark";
    if (percentage < 40) return "Dim";
    if (percentage < 60) return "Moderate";
    if (percentage < 80) return "Bright";
    return "Very Bright";
  };

  // Get gradient color based on light level
  const getGradientColor = (percentage: number | null) => {
    if (percentage === null) return "from-gray-400 to-gray-500";
    if (percentage < 30) return "from-emerald-800 to-emerald-700";
    if (percentage < 60) return "from-emerald-700 to-green-600";
    return "from-green-600 to-emerald-500";
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Forest Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMzAgNUwzNSAxNUwyNSAxNVoiIGZpbGw9IiMwMDAwMDAiIG9wYWNpdHk9IjAuMyIvPgo8cGF0aCBkPSJNMzAgMjBMMzggMzVIMjJaIiBmaWxsPSIjMDAwMDAwIiBvcGFjaXR5PSIwLjMiLz4KPHBhdGggZD0iTTMwIDM1TDQwIDU1SDIwWiIgZmlsbD0iIzAwMDAwMCIgb3BhY2l0eT0iMC4zIi8+Cjwvc3ZnPg==')] bg-repeat" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-600/20 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-green-600/15 rounded-full animate-pulse delay-300" />
        <div className="absolute top-2/3 left-1/2 w-2 h-2 bg-emerald-600/20 rounded-full animate-pulse delay-700" />
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-green-500/10 rounded-full animate-pulse delay-500" />
      </div>

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg
              className="w-12 h-12 text-emerald-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73V7H14C17.31 7 20 9.69 20 13C20 15.21 18.79 17.14 17 18.19V22H7V18.19C5.21 17.14 4 15.21 4 13C4 9.69 6.69 7 10 7H11V5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2M10 9C7.79 9 6 10.79 6 13C6 14.59 6.85 15.97 8.15 16.67L9 17.14V20H15V17.14L15.85 16.67C17.15 15.97 18 14.59 18 13C18 10.79 16.21 9 14 9H10Z" />
            </svg>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-green-600 to-teal-600">
              Forest Monitor
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Real-time light sensor monitoring for forest environments
          </p>
        </header>

        {/* Current Reading Card */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 border border-emerald-200 shadow-lg shadow-emerald-100/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-emerald-700 text-sm uppercase tracking-widest mb-2">
                  Current Light Level
                </h2>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-16 w-32 bg-emerald-200 rounded-lg" />
                  </div>
                ) : (
                  <>
                    <div
                      className={`text-6xl md:text-7xl font-bold bg-gradient-to-r ${getGradientColor(
                        currentLight
                      )} bg-clip-text text-transparent`}
                    >
                      {currentLight !== null ? `${currentLight}%` : "—"}
                    </div>
                    <div className="text-emerald-700 text-xl mt-2 flex items-center gap-2 justify-center md:justify-start">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          currentLight !== null && currentLight > 50
                            ? "bg-green-600"
                            : "bg-emerald-700"
                        } animate-pulse`}
                      />
                      {getLightDescription(currentLight)}
                    </div>
                  </>
                )}
              </div>

              {/* Light Level Visual Indicator */}
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
                      stroke="rgba(16, 185, 129, 0.15)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(currentLight || 0) * 2.51} 251`}
                      className="transition-all duration-500"
                    />
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="50%" stopColor="#16a34a" />
                        <stop offset="100%" stopColor="#65a30d" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className={`w-10 h-10 ${
                        currentLight !== null && currentLight > 50
                          ? "text-green-600"
                          : "text-emerald-700"
                      } transition-colors duration-500`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 7C9.24 7 7 9.24 7 12S9.24 17 12 17 17 14.76 17 12 14.76 7 12 7M12 2L14.39 5.42C13.65 5.15 12.84 5 12 5S10.35 5.15 9.61 5.42L12 2M3.34 7L7.5 6.65C6.9 7.16 6.36 7.78 5.94 8.5C5.5 9.24 5.25 10 5.11 10.79L3.34 7M3.36 17L5.12 13.23C5.26 14 5.53 14.78 5.95 15.5C6.37 16.24 6.91 16.86 7.5 17.37L3.36 17M20.65 7L18.88 10.79C18.74 10 18.47 9.23 18.05 8.5C17.63 7.78 17.1 7.15 16.5 6.64L20.65 7M20.64 17L16.5 17.36C17.09 16.85 17.62 16.22 18.04 15.5C18.46 14.77 18.73 14 18.87 13.21L20.64 17M12 22L9.59 18.56C10.33 18.83 11.14 19 12 19S13.66 18.83 14.4 18.56L12 22Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-6 md:p-8 border border-emerald-200 shadow-lg shadow-emerald-100/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center gap-3">
              <svg
                className="w-6 h-6 text-emerald-600"
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
              Light History
            </h2>
            <span className="text-emerald-600/70 text-sm">
              Last {sensorData.length} readings
            </span>
          </div>

          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                <span className="text-emerald-600">Loading sensor data...</span>
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
                  Waiting for data from the forest sensors...
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
                    <linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#65a30d" stopOpacity={0.8} />
                      <stop
                        offset="50%"
                        stopColor="#16a34a"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="#059669"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(16, 185, 129, 0.2)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTime}
                    stroke="#059669"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(16, 185, 129, 0.4)" }}
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#059669"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(16, 185, 129, 0.4)" }}
                    tick={{ fill: "#6b7280" }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ color: "#047857", fontWeight: 600 }}
                    itemStyle={{ color: "#059669" }}
                    formatter={(value: number) => [`${value}%`, "Light Level"]}
                    labelFormatter={(label) => formatTime(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="lightPercentage"
                    stroke="#059669"
                    strokeWidth={3}
                    fill="url(#colorLight)"
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: "#059669",
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
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 8L6 14H18L12 8Z" />
                </svg>
                <span className="text-emerald-700 text-sm uppercase tracking-wide">
                  Minimum
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {Math.min(...sensorData.map((d) => d.lightPercentage))}%
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-amber-500"
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
                <span className="text-emerald-700 text-sm uppercase tracking-wide">
                  Average
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {(
                  sensorData.reduce((acc, d) => acc + d.lightPercentage, 0) /
                  sensorData.length
                ).toFixed(1)}
                %
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 16L6 10H18L12 16Z" />
                </svg>
                <span className="text-emerald-700 text-sm uppercase tracking-wide">
                  Maximum
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {Math.max(...sensorData.map((d) => d.lightPercentage))}%
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
