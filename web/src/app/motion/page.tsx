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

interface MotionEvent {
  id: string;
  timestamp: number;
}

export default function MotionSensorPage() {
  const [motionEvents, setMotionEvents] = useState<MotionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastMotionTimestamp, setLastMotionTimestamp] = useState<number | null>(
    null
  );
  const [relativeTimeText, setRelativeTimeText] = useState<string>("");

  // Update relative time text every second
  useEffect(() => {
    if (lastMotionTimestamp === null) return;

    const updateRelativeTime = () => {
      setRelativeTimeText(formatRelativeTime(lastMotionTimestamp));
    };

    // Update immediately
    updateRelativeTime();

    // Update every second
    const interval = setInterval(updateRelativeTime, 1000);

    return () => clearInterval(interval);
  }, [lastMotionTimestamp]);

  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/motion");
    const sensorsQuery = query(
      sensorsRef,
      orderByChild("timestamp"),
      limitToLast(20)
    );

    const unsubscribe = onValue(sensorsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const events: MotionEvent[] = Object.entries(data).map(
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

        setMotionEvents(events);
        if (events.length > 0) {
          setLastMotionTimestamp(events[0].timestamp);
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
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-600/20 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-sky-600/15 rounded-full animate-pulse delay-300" />
        <div className="absolute top-2/3 left-1/2 w-2 h-2 bg-blue-600/20 rounded-full animate-pulse delay-700" />
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-sky-500/10 rounded-full animate-pulse delay-500" />
      </div>

      <Header />

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z" />
            </svg>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-600">
              Motion Sensor
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Motion detection monitoring for forest environments
          </p>
        </header>

        {/* Last Motion Card */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-3xl p-8 border border-blue-200 shadow-lg shadow-blue-100/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-blue-700 text-sm uppercase tracking-widest mb-2">
                  Last Motion Detected
                </h2>
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-16 w-48 bg-blue-200 rounded-lg" />
                  </div>
                ) : lastMotionTimestamp ? (
                  <>
                    <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-700 to-sky-600 bg-clip-text text-transparent">
                      {relativeTimeText}
                    </div>
                    <div className="text-gray-500 text-lg mt-2">
                      {formatDateTime(lastMotionTimestamp)}
                    </div>
                  </>
                ) : (
                  <div className="text-4xl md:text-5xl font-bold text-gray-400">
                    No motion detected
                  </div>
                )}
              </div>

              {/* Motion Visual Indicator */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-32 h-32">
                  <div
                    className={`absolute inset-0 rounded-full ${
                      lastMotionTimestamp &&
                      Date.now() - lastMotionTimestamp < 60000
                        ? "bg-sky-500/20 animate-ping"
                        : "bg-blue-100"
                    }`}
                  />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center">
                    <svg
                      className={`w-12 h-12 ${
                        lastMotionTimestamp &&
                        Date.now() - lastMotionTimestamp < 60000
                          ? "text-sky-600"
                          : "text-blue-600"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z" />
                    </svg>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    lastMotionTimestamp &&
                    Date.now() - lastMotionTimestamp < 60000
                      ? "text-sky-600"
                      : "text-blue-600"
                  }`}
                >
                  {lastMotionTimestamp &&
                  Date.now() - lastMotionTimestamp < 60000
                    ? "Recently Active"
                    : "Monitoring"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Motion Events Timeline */}
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-3xl p-6 md:p-8 border border-blue-200 shadow-lg shadow-blue-100/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center gap-3">
              <svg
                className="w-6 h-6 text-blue-600"
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
              Motion History
            </h2>
            <span className="text-blue-600/70 text-sm">
              Last {motionEvents.length} events
            </span>
          </div>

          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-blue-600">Loading motion data...</span>
              </div>
            </div>
          ) : motionEvents.length === 0 ? (
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
                <p className="text-lg">No motion events recorded</p>
                <p className="text-sm mt-2">
                  Waiting for motion detection from the forest sensors...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {motionEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl border border-blue-100 hover:border-blue-200 transition-colors"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index === 0 ? "bg-sky-500" : "bg-blue-300"
                      }`}
                    />
                    {index < motionEvents.length - 1 && (
                      <div className="w-0.5 h-8 bg-blue-200 mt-1" />
                    )}
                  </div>

                  {/* Event content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z" />
                      </svg>
                      <span className="font-medium text-gray-800">
                        Motion Detected
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-700 rounded-full">
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
                    <div className="text-blue-600 font-medium">
                      {formatRelativeTime(event.timestamp)}
                    </div>
                    {index < motionEvents.length - 1 && (
                      <div className="text-xs text-gray-400 mt-1">
                        {getTimeDiff(
                          event.timestamp,
                          motionEvents[index + 1].timestamp
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
        {motionEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-blue-600"
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
                <span className="text-blue-700 text-sm uppercase tracking-wide">
                  Total Events
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {motionEvents.length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-sky-600"
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
                <span className="text-blue-700 text-sm uppercase tracking-wide">
                  First Detected
                </span>
              </div>
              <div className="text-lg font-bold text-gray-800">
                {formatDateTime(
                  motionEvents[motionEvents.length - 1].timestamp
                )}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-cyan-500"
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
                <span className="text-blue-700 text-sm uppercase tracking-wide">
                  Latest Detected
                </span>
              </div>
              <div className="text-lg font-bold text-gray-800">
                {formatDateTime(motionEvents[0].timestamp)}
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
