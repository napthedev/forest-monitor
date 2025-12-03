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
import Header from "@/components/Header";
import { formatRelativeTime, formatDateTime } from "@/lib/utils";
import { Mountain } from "lucide-react";

interface VibrationEvent {
  id: string;
  timestamp: number;
}

export default function VibrationSensorPage() {
  const [vibrationEvents, setVibrationEvents] = useState<VibrationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVibrationTimestamp, setLastVibrationTimestamp] = useState<
    number | null
  >(null);
  const [relativeTimeText, setRelativeTimeText] = useState<string>("");

  // Update relative time text every second
  useEffect(() => {
    if (lastVibrationTimestamp === null) return;

    const updateRelativeTime = () => {
      setRelativeTimeText(formatRelativeTime(lastVibrationTimestamp));
    };

    // Update immediately
    updateRelativeTime();

    // Update every second
    const interval = setInterval(updateRelativeTime, 1000);

    return () => clearInterval(interval);
  }, [lastVibrationTimestamp]);

  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/vibration");
    const sensorsQuery = query(
      sensorsRef,
      orderByChild("timestamp"),
      limitToLast(20)
    );

    const unsubscribe = onValue(sensorsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const events: VibrationEvent[] = Object.entries(data).map(
          ([id, record]) => {
            const { timestamp } = record as { timestamp: number };
            return {
              id,
              timestamp,
            };
          }
        );

        // Sort by timestamp (newest first)
        events.sort((a, b) => b.timestamp - a.timestamp);

        setVibrationEvents(events);
        if (events.length > 0) {
          setLastVibrationTimestamp(events[0].timestamp);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get time difference between consecutive events
  const getTimeDiff = (current: number, previous: number): string => {
    const diffInSeconds = Math.floor((current - previous) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s after`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m after`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h after`;
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Forest Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMzAgNUwzNSAxNUwyNSAxNVoiIGZpbGw9IiMwMDAwMDAiIG9wYWNpdHk9IjAuMyIvPgo8cGF0aCBkPSJNMzAgMjBMMzggMzVIMjJaIiBmaWxsPSIjMDAwMDAwIiBvcGFjaXR5PSIwLjMiLz4KPHBhdGggZD0iTTMwIDM1TDQwIDU1SDIwWiIgZmlsbD0iIzAwMDAwMCIgb3BhY2l0eT0iMC4zIi8+Cjwvc3ZnPg==')] bg-repeat" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-zinc-600/20 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-slate-600/15 rounded-full animate-pulse delay-300" />
        <div className="absolute top-2/3 left-1/2 w-2 h-2 bg-zinc-600/20 rounded-full animate-pulse delay-700" />
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-slate-500/10 rounded-full animate-pulse delay-500" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mountain className="w-12 h-12 text-zinc-700" />
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-zinc-800 via-gray-700 to-slate-600">
              Vibration Sensor
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Ground vibration monitoring for forest environments
          </p>
        </header>

        {/* Last Vibration Card */}
        <div className="mb-8">
          <div className="bg-linear-to-br from-zinc-50 to-slate-50 rounded-3xl p-8 border border-zinc-200 shadow-lg shadow-zinc-100/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-zinc-700 text-sm uppercase tracking-widest mb-2">
                  Last Vibration Detected
                </h2>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-16 w-48 bg-zinc-200 rounded-lg" />
                  </div>
                ) : lastVibrationTimestamp ? (
                  <>
                    <div className="text-4xl md:text-5xl font-bold bg-linear-to-r from-zinc-800 to-slate-600 bg-clip-text text-transparent">
                      {relativeTimeText}
                    </div>
                    <div className="text-gray-500 text-lg mt-2">
                      {formatDateTime(lastVibrationTimestamp)}
                    </div>
                  </>
                ) : (
                  <div className="text-4xl md:text-5xl font-bold text-gray-400">
                    No vibration detected
                  </div>
                )}
              </div>

              {/* Vibration Visual Indicator */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-32 h-32">
                  <div
                    className={`absolute inset-0 rounded-full ${
                      lastVibrationTimestamp &&
                      Date.now() - lastVibrationTimestamp < 60000
                        ? "bg-slate-500/20 animate-ping"
                        : "bg-zinc-100"
                    }`}
                  />
                  <div className="absolute inset-4 rounded-full bg-linear-to-br from-zinc-100 to-slate-100 flex items-center justify-center">
                    <Mountain
                      className={`w-12 h-12 ${
                        lastVibrationTimestamp &&
                        Date.now() - lastVibrationTimestamp < 60000
                          ? "text-slate-700"
                          : "text-zinc-600"
                      }`}
                    />
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    lastVibrationTimestamp &&
                    Date.now() - lastVibrationTimestamp < 60000
                      ? "text-slate-700"
                      : "text-zinc-600"
                  }`}
                >
                  {lastVibrationTimestamp &&
                  Date.now() - lastVibrationTimestamp < 60000
                    ? "Recently Active"
                    : "Monitoring"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vibration Events Timeline */}
        <div className="bg-linear-to-br from-zinc-50 to-slate-50 rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-lg shadow-zinc-100/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center gap-3">
              <svg
                className="w-6 h-6 text-zinc-600"
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
              Vibration History
            </h2>
            <span className="text-zinc-600/70 text-sm">
              Last {vibrationEvents.length} events
            </span>
          </div>

          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
                <span className="text-zinc-600">Loading vibration data...</span>
              </div>
            </div>
          ) : vibrationEvents.length === 0 ? (
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
                <p className="text-lg">No vibration events recorded</p>
                <p className="text-sm mt-2">
                  Waiting for vibration detection from the forest sensors...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {vibrationEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-colors"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index === 0 ? "bg-slate-600" : "bg-zinc-300"
                      }`}
                    />
                    {index < vibrationEvents.length - 1 && (
                      <div className="w-0.5 h-8 bg-zinc-200 mt-1" />
                    )}
                  </div>

                  {/* Event content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Mountain className="w-5 h-5 text-zinc-600" />
                      <span className="font-medium text-gray-800">
                        Vibration Detected
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500 text-sm mt-1">
                      {formatDateTime(event.timestamp)}
                    </div>
                  </div>

                  {/* Time difference */}
                  <div className="text-right">
                    <div className="text-zinc-600 font-medium">
                      {formatRelativeTime(event.timestamp)}
                    </div>
                    {index < vibrationEvents.length - 1 && (
                      <div className="text-xs text-gray-400 mt-1">
                        {getTimeDiff(
                          event.timestamp,
                          vibrationEvents[index + 1].timestamp
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {vibrationEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-linear-to-br from-zinc-50 to-slate-50 rounded-2xl p-6 border border-zinc-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-zinc-600"
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
                <span className="text-zinc-700 text-sm uppercase tracking-wide">
                  Total Events
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {vibrationEvents.length}
              </div>
            </div>
            <div className="bg-linear-to-br from-zinc-50 to-slate-50 rounded-2xl p-6 border border-zinc-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-slate-600"
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
                <span className="text-zinc-700 text-sm uppercase tracking-wide">
                  First Detected
                </span>
              </div>
              <div className="text-lg font-bold text-gray-800">
                {formatDateTime(
                  vibrationEvents[vibrationEvents.length - 1].timestamp
                )}
              </div>
            </div>
            <div className="bg-linear-to-br from-zinc-50 to-slate-50 rounded-2xl p-6 border border-zinc-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="text-zinc-700 text-sm uppercase tracking-wide">
                  Latest Detected
                </span>
              </div>
              <div className="text-lg font-bold text-gray-800">
                {formatDateTime(vibrationEvents[0].timestamp)}
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
