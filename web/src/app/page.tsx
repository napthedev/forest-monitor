"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { database } from "@/lib/firebase";
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  onValue,
} from "firebase/database";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import Header from "@/components/Header";
import {
  formatRelativeTime,
  convertToPercentage,
  getLightDescription,
} from "@/lib/utils";

interface LightSensorData {
  timestamp: string;
  lightPercentage: number;
}

export default function Home() {
  // Light sensor state
  const [lightData, setLightData] = useState<LightSensorData[]>([]);
  const [currentLight, setCurrentLight] = useState<number | null>(null);
  const [lightLoading, setLightLoading] = useState(true);

  // Motion sensor state
  const [lastMotionTimestamp, setLastMotionTimestamp] = useState<number | null>(
    null
  );
  const [motionRelativeTime, setMotionRelativeTime] = useState<string>("");
  const [motionLoading, setMotionLoading] = useState(true);

  // Update motion relative time every second
  useEffect(() => {
    if (lastMotionTimestamp === null) return;

    const updateRelativeTime = () => {
      setMotionRelativeTime(formatRelativeTime(lastMotionTimestamp));
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 1000);

    return () => clearInterval(interval);
  }, [lastMotionTimestamp]);

  // Fetch light sensor data (last 10 readings for preview)
  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/light");
    const sensorsQuery = query(
      sensorsRef,
      orderByChild("timestamp"),
      limitToLast(10)
    );

    const unsubscribe = onValue(sensorsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData: LightSensorData[] = Object.entries(data).map(
          ([, record]) => {
            const { timestamp, value } = record as {
              timestamp: number;
              value: number;
            };
            return {
              timestamp: String(timestamp),
              lightPercentage: convertToPercentage(value),
            };
          }
        );

        formattedData.sort(
          (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
        );

        setLightData(formattedData);
        if (formattedData.length > 0) {
          setCurrentLight(
            formattedData[formattedData.length - 1].lightPercentage
          );
        }
      }
      setLightLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch motion sensor data (last event only)
  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/motion");
    const sensorsQuery = query(
      sensorsRef,
      orderByChild("timestamp"),
      limitToLast(1)
    );

    const unsubscribe = onValue(sensorsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entries = Object.entries(data);
        if (entries.length > 0) {
          const [, record] = entries[0];
          const { timestamp } = record as { timestamp: number };
          setLastMotionTimestamp(timestamp);
        }
      }
      setMotionLoading(false);
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
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-600/20 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-green-600/15 rounded-full animate-pulse delay-300" />
        <div className="absolute top-2/3 left-1/2 w-2 h-2 bg-emerald-600/20 rounded-full animate-pulse delay-700" />
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-green-500/10 rounded-full animate-pulse delay-500" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
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
            Real-time environmental monitoring for forest ecosystems
          </p>
        </header>

        {/* Sensor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Light Sensor Card */}
          <Link href="/light" className="group">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-6 border border-orange-200 shadow-lg shadow-orange-100/50 hover:shadow-xl hover:shadow-orange-100/70 transition-all duration-300 hover:scale-[1.02] h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 7C9.24 7 7 9.24 7 12S9.24 17 12 17 17 14.76 17 12 14.76 7 12 7M12 2L14.39 5.42C13.65 5.15 12.84 5 12 5S10.35 5.15 9.61 5.42L12 2M3.34 7L7.5 6.65C6.9 7.16 6.36 7.78 5.94 8.5C5.5 9.24 5.25 10 5.11 10.79L3.34 7M3.36 17L5.12 13.23C5.26 14 5.53 14.78 5.95 15.5C6.37 16.24 6.91 16.86 7.5 17.37L3.36 17M20.65 7L18.88 10.79C18.74 10 18.47 9.23 18.05 8.5C17.63 7.78 17.1 7.15 16.5 6.64L20.65 7M20.64 17L16.5 17.36C17.09 16.85 17.62 16.22 18.04 15.5C18.46 14.77 18.73 14 18.87 13.21L20.64 17M12 22L9.59 18.56C10.33 18.83 11.14 19 12 19S13.66 18.83 14.4 18.56L12 22Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Light Sensor
                  </h2>
                  <p className="text-sm text-gray-500">
                    Ambient light monitoring
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-orange-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>

              {lightLoading ? (
                <div className="animate-pulse">
                  <div className="h-24 bg-orange-200 rounded-xl mb-4" />
                  <div className="h-6 w-24 bg-orange-200 rounded" />
                </div>
              ) : (
                <>
                  {/* Mini Chart Preview */}
                  <div className="h-24 mb-4">
                    {lightData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={lightData}>
                          <defs>
                            <linearGradient
                              id="colorLightPreview"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#ea580c"
                                stopOpacity={0.6}
                              />
                              <stop
                                offset="95%"
                                stopColor="#ea580c"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="lightPercentage"
                            stroke="#ea580c"
                            strokeWidth={2}
                            fill="url(#colorLightPreview)"
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        No data available
                      </div>
                    )}
                  </div>

                  {/* Current Value */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-bold text-gray-800">
                        {currentLight !== null ? `${currentLight}%` : "—"}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {getLightDescription(currentLight)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          currentLight !== null && currentLight > 50
                            ? "bg-amber-500"
                            : "bg-orange-600"
                        } animate-pulse`}
                      />
                      Live
                    </div>
                  </div>
                </>
              )}
            </div>
          </Link>

          {/* Motion Sensor Card */}
          <Link href="/motion" className="group">
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-3xl p-6 border border-blue-200 shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-100/70 transition-all duration-300 hover:scale-[1.02] h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Motion Sensor
                  </h2>
                  <p className="text-sm text-gray-500">Wildlife detection</p>
                </div>
                <svg
                  className="w-5 h-5 text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>

              {motionLoading ? (
                <div className="animate-pulse">
                  <div className="h-24 bg-blue-200 rounded-xl mb-4" />
                  <div className="h-6 w-32 bg-blue-200 rounded" />
                </div>
              ) : (
                <>
                  {/* Motion Visual */}
                  <div className="h-24 mb-4 flex items-center justify-center">
                    <div className="relative">
                      <div
                        className={`absolute inset-0 rounded-full ${
                          lastMotionTimestamp &&
                          Date.now() - lastMotionTimestamp < 60000
                            ? "bg-sky-500/30 animate-ping"
                            : ""
                        }`}
                        style={{ width: "80px", height: "80px" }}
                      />
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center relative">
                        <svg
                          className={`w-10 h-10 ${
                            lastMotionTimestamp &&
                            Date.now() - lastMotionTimestamp < 60000
                              ? "text-sky-600"
                              : "text-blue-500"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Last Motion Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      {lastMotionTimestamp ? (
                        <>
                          <span className="text-lg font-bold text-gray-800">
                            Last detected
                          </span>
                          <span className="text-blue-600 font-medium ml-2">
                            {motionRelativeTime}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500">
                          No motion detected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          lastMotionTimestamp &&
                          Date.now() - lastMotionTimestamp < 60000
                            ? "bg-sky-500"
                            : "bg-blue-600"
                        } animate-pulse`}
                      />
                      {lastMotionTimestamp &&
                      Date.now() - lastMotionTimestamp < 60000
                        ? "Active"
                        : "Monitoring"}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Link>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>🌲 Forest Monitor • Real-time environmental sensing</p>
        </footer>
      </main>
    </div>
  );
}
