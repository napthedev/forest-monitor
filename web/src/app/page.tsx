"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TreePine,
  Sun,
  ChevronRight,
  PersonStanding,
  Cloud,
  Flame,
  Droplets,
} from "lucide-react";
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
  convertToGasPercentage,
  getGasDescription,
  convertToFlamePercentage,
  getFlameDescription,
  convertToMoisturePercentage,
  getMoistureDescription,
} from "@/lib/utils";

interface LightSensorData {
  timestamp: string;
  lightPercentage: number;
}

interface GasSensorData {
  timestamp: string;
  gasPercentage: number;
}

interface FlameSensorData {
  timestamp: string;
  flamePercentage: number;
}

interface SoilMoistureSensorData {
  timestamp: string;
  moisturePercentage: number;
}

export default function Home() {
  // Light sensor state
  const [lightData, setLightData] = useState<LightSensorData[]>([]);
  const [currentLight, setCurrentLight] = useState<number | null>(null);
  const [lightLoading, setLightLoading] = useState(true);
  const [lastLightTimestamp, setLastLightTimestamp] = useState<number | null>(
    null
  );
  const [lightStatusText, setLightStatusText] = useState<string>("Live");

  // Motion sensor state
  const [lastMotionTimestamp, setLastMotionTimestamp] = useState<number | null>(
    null
  );
  const [motionRelativeTime, setMotionRelativeTime] = useState<string>("");
  const [motionLoading, setMotionLoading] = useState(true);

  // Gas sensor state
  const [gasData, setGasData] = useState<GasSensorData[]>([]);
  const [currentGas, setCurrentGas] = useState<number | null>(null);
  const [gasLoading, setGasLoading] = useState(true);
  const [lastGasTimestamp, setLastGasTimestamp] = useState<number | null>(null);
  const [gasStatusText, setGasStatusText] = useState<string>("Live");

  // Flame sensor state
  const [flameData, setFlameData] = useState<FlameSensorData[]>([]);
  const [currentFlame, setCurrentFlame] = useState<number | null>(null);
  const [flameLoading, setFlameLoading] = useState(true);
  const [lastFlameTimestamp, setLastFlameTimestamp] = useState<number | null>(
    null
  );
  const [flameStatusText, setFlameStatusText] = useState<string>("Live");

  // Soil moisture sensor state
  const [soilMoistureData, setSoilMoistureData] = useState<
    SoilMoistureSensorData[]
  >([]);
  const [currentMoisture, setCurrentMoisture] = useState<number | null>(null);
  const [soilMoistureLoading, setSoilMoistureLoading] = useState(true);
  const [lastMoistureTimestamp, setLastMoistureTimestamp] = useState<
    number | null
  >(null);
  const [moistureStatusText, setMoistureStatusText] = useState<string>("Live");

  // Check if fire alert (percentage > 70)
  const isFireAlert = currentFlame !== null && currentFlame > 70;

  // Helper function to get status text for analog sensors
  const getAnalogSensorStatus = (timestamp: number | null): string => {
    if (!timestamp) return "Live";
    const timeDiff = Date.now() - timestamp;
    if (timeDiff < 10000) {
      return "Live";
    }

    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
    }
  };

  // Update light status text every second
  useEffect(() => {
    if (lastLightTimestamp === null) return;

    const updateStatus = () => {
      setLightStatusText(getAnalogSensorStatus(lastLightTimestamp));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [lastLightTimestamp]);

  // Update gas status text every second
  useEffect(() => {
    if (lastGasTimestamp === null) return;

    const updateStatus = () => {
      setGasStatusText(getAnalogSensorStatus(lastGasTimestamp));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [lastGasTimestamp]);

  // Update flame status text every second
  useEffect(() => {
    if (lastFlameTimestamp === null) return;

    const updateStatus = () => {
      setFlameStatusText(getAnalogSensorStatus(lastFlameTimestamp));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [lastFlameTimestamp]);

  // Update moisture status text every second
  useEffect(() => {
    if (lastMoistureTimestamp === null) return;

    const updateStatus = () => {
      setMoistureStatusText(getAnalogSensorStatus(lastMoistureTimestamp));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [lastMoistureTimestamp]);

  // Update motion relative time every second
  useEffect(() => {
    if (lastMotionTimestamp === null) return;

    const updateMotionRelativeTime = () => {
      setMotionRelativeTime(formatRelativeTime(lastMotionTimestamp));
    };

    // Update immediately
    updateMotionRelativeTime();

    // Update every second
    const interval = setInterval(updateMotionRelativeTime, 1000);

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
          const lastRecord = formattedData[formattedData.length - 1];
          setCurrentLight(lastRecord.lightPercentage);
          setLastLightTimestamp(parseInt(lastRecord.timestamp));
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

  // Fetch gas sensor data (last 10 readings for preview)
  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/gas");
    const sensorsQuery = query(
      sensorsRef,
      orderByChild("timestamp"),
      limitToLast(10)
    );

    const unsubscribe = onValue(sensorsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData: GasSensorData[] = Object.entries(data).map(
          ([, record]) => {
            const { timestamp, value } = record as {
              timestamp: number;
              value: number;
            };
            return {
              timestamp: String(timestamp),
              gasPercentage: convertToGasPercentage(value),
            };
          }
        );

        formattedData.sort(
          (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
        );

        setGasData(formattedData);
        if (formattedData.length > 0) {
          const lastRecord = formattedData[formattedData.length - 1];
          setCurrentGas(lastRecord.gasPercentage);
          setLastGasTimestamp(parseInt(lastRecord.timestamp));
        }
      }
      setGasLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch flame sensor data (last 10 readings for preview)
  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/flame");
    const sensorsQuery = query(
      sensorsRef,
      orderByChild("timestamp"),
      limitToLast(10)
    );

    const unsubscribe = onValue(sensorsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData: FlameSensorData[] = Object.entries(data).map(
          ([, record]) => {
            const { timestamp, value } = record as {
              timestamp: number;
              value: number;
            };
            return {
              timestamp: String(timestamp),
              flamePercentage: convertToFlamePercentage(value),
            };
          }
        );

        formattedData.sort(
          (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
        );

        setFlameData(formattedData);
        if (formattedData.length > 0) {
          const lastRecord = formattedData[formattedData.length - 1];
          setCurrentFlame(lastRecord.flamePercentage);
          setLastFlameTimestamp(parseInt(lastRecord.timestamp));
        }
      }
      setFlameLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch soil moisture sensor data (last 10 readings for preview)
  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/soil-moisture");
    const sensorsQuery = query(
      sensorsRef,
      orderByChild("timestamp"),
      limitToLast(10)
    );

    const unsubscribe = onValue(sensorsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData: SoilMoistureSensorData[] = Object.entries(
          data
        ).map(([, record]) => {
          const { timestamp, value } = record as {
            timestamp: number;
            value: number;
          };
          return {
            timestamp: String(timestamp),
            moisturePercentage: convertToMoisturePercentage(value),
          };
        });

        formattedData.sort(
          (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
        );

        setSoilMoistureData(formattedData);
        if (formattedData.length > 0) {
          const lastRecord = formattedData[formattedData.length - 1];
          setCurrentMoisture(lastRecord.moisturePercentage);
          setLastMoistureTimestamp(parseInt(lastRecord.timestamp));
        }
      }
      setSoilMoistureLoading(false);
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
            <TreePine className="w-12 h-12 text-emerald-600" />
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
                  <Sun className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Light Sensor
                  </h2>
                  <p className="text-sm text-gray-500">
                    Ambient light monitoring
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
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
                          lightStatusText === "Live"
                            ? "bg-amber-500"
                            : "bg-orange-600"
                        } animate-pulse`}
                      />
                      {lightStatusText}
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
                  <PersonStanding className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Motion Sensor
                  </h2>
                  <p className="text-sm text-gray-500">Wildlife detection</p>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
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
                        <PersonStanding
                          className={`w-10 h-10 ${
                            lastMotionTimestamp &&
                            Date.now() - lastMotionTimestamp < 60000
                              ? "text-sky-600"
                              : "text-blue-500"
                          }`}
                        />
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

          {/* Gas Sensor Card */}
          <Link href="/gas" className="group">
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-3xl p-6 border border-gray-200 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-100/70 transition-all duration-300 hover:scale-[1.02] h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-slate-500 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
                  <Cloud className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Gas Sensor
                  </h2>
                  <p className="text-sm text-gray-500">Smoke & gas detection</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {gasLoading ? (
                <div className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-xl mb-4" />
                  <div className="h-6 w-24 bg-gray-200 rounded" />
                </div>
              ) : (
                <>
                  {/* Mini Chart Preview */}
                  <div className="h-24 mb-4">
                    {gasData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={gasData}>
                          <defs>
                            <linearGradient
                              id="colorGasPreview"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#6b7280"
                                stopOpacity={0.6}
                              />
                              <stop
                                offset="95%"
                                stopColor="#6b7280"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="gasPercentage"
                            stroke="#6b7280"
                            strokeWidth={2}
                            fill="url(#colorGasPreview)"
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
                        {currentGas !== null ? `${currentGas}%` : "—"}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {getGasDescription(currentGas)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          gasStatusText === "Live"
                            ? "bg-amber-500"
                            : "bg-gray-500"
                        } animate-pulse`}
                      />
                      {gasStatusText}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Link>

          {/* Flame Sensor Card */}
          <Link href="/flame" className="group">
            <div
              className={`bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl p-6 border shadow-lg transition-all duration-300 hover:scale-[1.02] h-full relative ${
                isFireAlert
                  ? "border-red-500 shadow-red-200/70 animate-pulse"
                  : "border-red-200 shadow-red-100/50 hover:shadow-xl hover:shadow-red-100/70"
              }`}
            >
              {/* Fire Alert Badge */}
              {isFireAlert && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  ⚠️ Alert
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Flame Sensor
                  </h2>
                  <p className="text-sm text-gray-500">Fire detection</p>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {flameLoading ? (
                <div className="animate-pulse">
                  <div className="h-24 bg-red-200 rounded-xl mb-4" />
                  <div className="h-6 w-24 bg-red-200 rounded" />
                </div>
              ) : (
                <>
                  {/* Mini Chart Preview */}
                  <div className="h-24 mb-4">
                    {flameData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={flameData}>
                          <defs>
                            <linearGradient
                              id="colorFlamePreview"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#dc2626"
                                stopOpacity={0.6}
                              />
                              <stop
                                offset="95%"
                                stopColor="#dc2626"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="flamePercentage"
                            stroke="#dc2626"
                            strokeWidth={2}
                            fill="url(#colorFlamePreview)"
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
                        {currentFlame !== null ? `${currentFlame}%` : "—"}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {getFlameDescription(currentFlame)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          flameStatusText === "Live"
                            ? "bg-red-600"
                            : "bg-green-500"
                        } animate-pulse`}
                      />
                      {isFireAlert ? "Alert!" : flameStatusText}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Link>

          {/* Soil Moisture Sensor Card */}
          <Link href="/soil-moisture" className="group">
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-6 border border-amber-200 shadow-lg shadow-amber-100/50 hover:shadow-xl hover:shadow-amber-100/70 transition-all duration-300 hover:scale-[1.02] h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-700 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Soil Moisture
                  </h2>
                  <p className="text-sm text-gray-500">
                    Ground water monitoring
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {soilMoistureLoading ? (
                <div className="animate-pulse">
                  <div className="h-24 bg-amber-200 rounded-xl mb-4" />
                  <div className="h-6 w-24 bg-amber-200 rounded" />
                </div>
              ) : (
                <>
                  {/* Mini Chart Preview */}
                  <div className="h-24 mb-4">
                    {soilMoistureData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={soilMoistureData}>
                          <defs>
                            <linearGradient
                              id="colorMoisturePreview"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#92400e"
                                stopOpacity={0.6}
                              />
                              <stop
                                offset="95%"
                                stopColor="#92400e"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="moisturePercentage"
                            stroke="#92400e"
                            strokeWidth={2}
                            fill="url(#colorMoisturePreview)"
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
                        {currentMoisture !== null ? `${currentMoisture}%` : "—"}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {getMoistureDescription(currentMoisture)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-700">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          moistureStatusText === "Live"
                            ? currentMoisture !== null && currentMoisture < 20
                              ? "bg-red-500"
                              : currentMoisture !== null && currentMoisture > 90
                              ? "bg-blue-500"
                              : "bg-amber-600"
                            : "bg-gray-400"
                        } animate-pulse`}
                      />
                      {moistureStatusText}
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
