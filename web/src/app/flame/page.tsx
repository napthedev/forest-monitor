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
  convertToFlamePercentage,
  getFlameDescription,
  getFlameGradientColor,
} from "@/lib/utils";

interface SensorData {
  timestamp: string;
  value: number;
  flamePercentage: number;
}

export default function FlameSensorPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [currentFlame, setCurrentFlame] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState<
    number | null
  >(null);
  const [relativeTimeText, setRelativeTimeText] = useState<string>("");

  // Check if fire alert (percentage > 70)
  const isFireAlert = currentFlame !== null && currentFlame > 70;

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
    const sensorsRef = ref(database, "/sensors/flame");
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
              flamePercentage: convertToFlamePercentage(value),
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
          setCurrentFlame(latestData.flamePercentage);
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
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-600/20 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-rose-600/15 rounded-full animate-pulse delay-300" />
        <div className="absolute top-2/3 left-1/2 w-2 h-2 bg-red-600/20 rounded-full animate-pulse delay-700" />
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-orange-500/10 rounded-full animate-pulse delay-500" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg
              className="w-12 h-12 text-red-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5Z" />
            </svg>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-700 via-rose-600 to-orange-600">
              Flame Sensor
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Real-time fire and flame detection for forest protection
          </p>
        </header>

        {/* Fire Alert Banner */}
        {isFireAlert && (
          <div className="mb-8 bg-red-600 text-white rounded-2xl p-4 flex items-center justify-center gap-3 animate-pulse">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
            </svg>
            <span className="font-bold text-lg">
              ⚠️ Fire Alert! High flame detection level
            </span>
          </div>
        )}

        {/* Current Reading Card */}
        <div className="mb-8">
          <div
            className={`bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl p-8 border shadow-lg transition-all duration-300 ${
              isFireAlert
                ? "border-red-500 shadow-red-200/70 animate-pulse"
                : "border-red-200 shadow-red-100/50"
            }`}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-red-700 text-sm uppercase tracking-widest mb-2">
                  Current Flame Level
                </h2>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-16 w-32 bg-red-200 rounded-lg" />
                  </div>
                ) : (
                  <>
                    <div
                      className={`text-6xl md:text-7xl font-bold bg-gradient-to-r ${getFlameGradientColor(
                        currentFlame
                      )} bg-clip-text text-transparent`}
                    >
                      {currentFlame !== null ? `${currentFlame}%` : "—"}
                    </div>
                    <div className="text-red-700 text-xl mt-2 flex items-center gap-2 justify-center md:justify-start">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          currentFlame !== null && currentFlame > 40
                            ? "bg-red-600"
                            : "bg-green-600"
                        } animate-pulse`}
                      />
                      {getFlameDescription(currentFlame)}
                    </div>
                    {relativeTimeText && (
                      <div className="text-gray-500 text-sm mt-2 flex items-center gap-1 justify-center md:justify-start">
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

              {/* Flame Level Visual Indicator */}
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
                      stroke="rgba(220, 38, 38, 0.15)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#flameGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(currentFlame || 0) * 2.51} 251`}
                      className="transition-all duration-500"
                    />
                    <defs>
                      <linearGradient
                        id="flameGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#dc2626" />
                        <stop offset="50%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className={`w-10 h-10 ${
                        currentFlame !== null && currentFlame > 40
                          ? "text-red-600"
                          : "text-rose-500"
                      } transition-colors duration-500`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div
          className={`bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl p-6 md:p-8 border shadow-lg transition-all duration-300 ${
            isFireAlert
              ? "border-red-500 shadow-red-200/70"
              : "border-red-200 shadow-red-100/50"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center gap-3">
              <svg
                className="w-6 h-6 text-red-600"
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
              Flame History
            </h2>
            <span className="text-red-600/70 text-sm">
              Last {sensorData.length} readings
            </span>
          </div>

          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                <span className="text-red-600">Loading sensor data...</span>
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
                    <linearGradient id="colorFlame" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                      <stop
                        offset="50%"
                        stopColor="#dc2626"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="#991b1b"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(220, 38, 38, 0.2)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTime}
                    stroke="#dc2626"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(220, 38, 38, 0.4)" }}
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#dc2626"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(220, 38, 38, 0.4)" }}
                    tick={{ fill: "#6b7280" }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                      border: "1px solid rgba(220, 38, 38, 0.3)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ color: "#b91c1c", fontWeight: 600 }}
                    itemStyle={{ color: "#dc2626" }}
                    formatter={(value: number) => [`${value}%`, "Flame Level"]}
                    labelFormatter={(label) => formatTime(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="flamePercentage"
                    stroke="#dc2626"
                    strokeWidth={3}
                    fill="url(#colorFlame)"
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: "#dc2626",
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
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 8L6 14H18L12 8Z" />
                </svg>
                <span className="text-red-700 text-sm uppercase tracking-wide">
                  Minimum
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {Math.min(...sensorData.map((d) => d.flamePercentage))}%
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200">
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
                <span className="text-red-700 text-sm uppercase tracking-wide">
                  Average
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {(
                  sensorData.reduce((acc, d) => acc + d.flamePercentage, 0) /
                  sensorData.length
                ).toFixed(1)}
                %
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 16L6 10H18L12 16Z" />
                </svg>
                <span className="text-red-700 text-sm uppercase tracking-wide">
                  Maximum
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {Math.max(...sensorData.map((d) => d.flamePercentage))}%
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
