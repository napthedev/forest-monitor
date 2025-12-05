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
  Volume2,
  Mountain,
  Thermometer,
  Earth,
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
  getFlameAlertThreshold,
  convertToMoisturePercentage,
  getMoistureDescription,
  convertToSoundPercentage,
  getSoundDescription,
  isSoundAlert,
  getTemperatureDescription,
  getHumidityDescription,
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

interface SoundSensorData {
  timestamp: string;
  soundPercentage: number;
}

interface TemperatureSensorData {
  timestamp: string;
  temperature: number;
}

interface HumiditySensorData {
  timestamp: string;
  humidity: number;
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

  // Vibration sensor state
  const [lastVibrationTimestamp, setLastVibrationTimestamp] = useState<
    number | null
  >(null);
  const [vibrationRelativeTime, setVibrationRelativeTime] =
    useState<string>("");
  const [vibrationLoading, setVibrationLoading] = useState(true);

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

  // Sound sensor state
  const [soundData, setSoundData] = useState<SoundSensorData[]>([]);
  const [currentSound, setCurrentSound] = useState<number | null>(null);
  const [soundLoading, setSoundLoading] = useState(true);
  const [lastSoundTimestamp, setLastSoundTimestamp] = useState<number | null>(
    null
  );
  const [soundStatusText, setSoundStatusText] = useState<string>("Live");

  // Temperature sensor state
  const [temperatureData, setTemperatureData] = useState<
    TemperatureSensorData[]
  >([]);
  const [currentTemperature, setCurrentTemperature] = useState<number | null>(
    null
  );
  const [temperatureLoading, setTemperatureLoading] = useState(true);
  const [lastTemperatureTimestamp, setLastTemperatureTimestamp] = useState<
    number | null
  >(null);
  const [temperatureStatusText, setTemperatureStatusText] =
    useState<string>("Live");

  // Humidity sensor state
  const [humidityData, setHumidityData] = useState<HumiditySensorData[]>([]);
  const [currentHumidity, setCurrentHumidity] = useState<number | null>(null);
  const [humidityLoading, setHumidityLoading] = useState(true);
  const [lastHumidityTimestamp, setLastHumidityTimestamp] = useState<
    number | null
  >(null);
  const [humidityStatusText, setHumidityStatusText] = useState<string>("Live");

  // Check if fire alert (percentage >= threshold, which corresponds to raw value < 1000)
  const flameAlertThreshold = getFlameAlertThreshold();
  const isFireAlert =
    currentFlame !== null && currentFlame >= flameAlertThreshold;

  // Check if sound alert (percentage >= 75%)
  const isSoundAlertActive = isSoundAlert(currentSound);

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

  // Update sound status text every second
  useEffect(() => {
    if (lastSoundTimestamp === null) return;

    const updateStatus = () => {
      setSoundStatusText(getAnalogSensorStatus(lastSoundTimestamp));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [lastSoundTimestamp]);

  // Update temperature status text every second
  useEffect(() => {
    if (lastTemperatureTimestamp === null) return;

    const updateStatus = () => {
      setTemperatureStatusText(getAnalogSensorStatus(lastTemperatureTimestamp));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [lastTemperatureTimestamp]);

  // Update humidity status text every second
  useEffect(() => {
    if (lastHumidityTimestamp === null) return;

    const updateStatus = () => {
      setHumidityStatusText(getAnalogSensorStatus(lastHumidityTimestamp));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [lastHumidityTimestamp]);

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

  // Update vibration relative time every second
  useEffect(() => {
    if (lastVibrationTimestamp === null) return;

    const updateVibrationRelativeTime = () => {
      setVibrationRelativeTime(formatRelativeTime(lastVibrationTimestamp));
    };

    // Update immediately
    updateVibrationRelativeTime();

    // Update every second
    const interval = setInterval(updateVibrationRelativeTime, 1000);

    return () => clearInterval(interval);
  }, [lastVibrationTimestamp]);

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

  // Fetch vibration sensor data (last event only)
  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/vibration");
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
          setLastVibrationTimestamp(timestamp);
        }
      }
      setVibrationLoading(false);
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

  // Fetch sound sensor data (last 10 readings for preview)
  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/sound");
    const sensorsQuery = query(
      sensorsRef,
      orderByChild("timestamp"),
      limitToLast(10)
    );

    const unsubscribe = onValue(sensorsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData: SoundSensorData[] = Object.entries(data).map(
          ([, record]) => {
            const { timestamp, amplitude } = record as {
              timestamp: number;
              amplitude: number;
            };
            return {
              timestamp: String(timestamp),
              soundPercentage: convertToSoundPercentage(amplitude),
            };
          }
        );

        formattedData.sort(
          (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
        );

        setSoundData(formattedData);
        if (formattedData.length > 0) {
          const lastRecord = formattedData[formattedData.length - 1];
          setCurrentSound(lastRecord.soundPercentage);
          setLastSoundTimestamp(parseInt(lastRecord.timestamp));
        }
      }
      setSoundLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch temperature sensor data (last 10 readings for preview)
  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/temperature");
    const sensorsQuery = query(
      sensorsRef,
      orderByChild("timestamp"),
      limitToLast(10)
    );

    const unsubscribe = onValue(sensorsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData: TemperatureSensorData[] = Object.entries(data).map(
          ([, record]) => {
            const { timestamp, value } = record as {
              timestamp: number;
              value: number;
            };
            return {
              timestamp: String(timestamp),
              temperature: value,
            };
          }
        );

        formattedData.sort(
          (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
        );

        setTemperatureData(formattedData);
        if (formattedData.length > 0) {
          const lastRecord = formattedData[formattedData.length - 1];
          setCurrentTemperature(lastRecord.temperature);
          setLastTemperatureTimestamp(parseInt(lastRecord.timestamp));
        }
      }
      setTemperatureLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch humidity sensor data (last 10 readings for preview)
  useEffect(() => {
    const sensorsRef = ref(database, "/sensors/humidity");
    const sensorsQuery = query(
      sensorsRef,
      orderByChild("timestamp"),
      limitToLast(10)
    );

    const unsubscribe = onValue(sensorsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData: HumiditySensorData[] = Object.entries(data).map(
          ([, record]) => {
            const { timestamp, value } = record as {
              timestamp: number;
              value: number;
            };
            return {
              timestamp: String(timestamp),
              humidity: value,
            };
          }
        );

        formattedData.sort(
          (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
        );

        setHumidityData(formattedData);
        if (formattedData.length > 0) {
          const lastRecord = formattedData[formattedData.length - 1];
          setCurrentHumidity(lastRecord.humidity);
          setLastHumidityTimestamp(parseInt(lastRecord.timestamp));
        }
      }
      setHumidityLoading(false);
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
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-emerald-700 via-green-600 to-teal-600">
              Forest Monitor
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Real-time environmental monitoring for forest ecosystems
          </p>
        </header>

        {/* Sensor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Light Sensor Card */}
          <Link href="/light" className="group">
            <div className="bg-linear-to-br from-orange-50 to-amber-50 rounded-3xl p-6 border border-orange-200 shadow-lg shadow-orange-100/50 hover:shadow-xl hover:shadow-orange-100/70 transition-all duration-300 hover:scale-[1.02] h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
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
            <div className="bg-linear-to-br from-blue-50 to-sky-50 rounded-3xl p-6 border border-blue-200 shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-100/70 transition-all duration-300 hover:scale-[1.02] h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
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
                      <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-100 to-sky-100 flex items-center justify-center relative">
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

          {/* Sound Sensor Card */}
          <Link href="/sound" className="group">
            <div
              className={`bg-linear-to-br from-cyan-50 to-sky-50 rounded-3xl p-6 border shadow-lg transition-all duration-300 hover:scale-[1.02] h-full relative ${
                isSoundAlertActive
                  ? "border-cyan-500 shadow-cyan-200/70 animate-pulse"
                  : "border-cyan-200 shadow-cyan-100/50 hover:shadow-xl hover:shadow-cyan-100/70"
              }`}
            >
              {/* Sound Alert Badge */}
              {isSoundAlertActive && (
                <div className="absolute -top-2 -right-2 bg-cyan-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  🔊 Loud
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-cyan-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-200">
                  <Volume2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Sound Sensor
                  </h2>
                  <p className="text-sm text-gray-500">Noise level detection</p>
                </div>
                <ChevronRight className="w-5 h-5 text-cyan-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {soundLoading ? (
                <div className="animate-pulse">
                  <div className="h-24 bg-cyan-200 rounded-xl mb-4" />
                  <div className="h-6 w-24 bg-cyan-200 rounded" />
                </div>
              ) : (
                <>
                  {/* Mini Chart Preview */}
                  <div className="h-24 mb-4">
                    {soundData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={soundData}>
                          <defs>
                            <linearGradient
                              id="colorSoundPreview"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#06b6d4"
                                stopOpacity={0.6}
                              />
                              <stop
                                offset="95%"
                                stopColor="#06b6d4"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="soundPercentage"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            fill="url(#colorSoundPreview)"
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
                        {currentSound !== null ? `${currentSound}%` : "—"}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {getSoundDescription(currentSound)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-cyan-600">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          soundStatusText === "Live"
                            ? "bg-cyan-500"
                            : "bg-gray-400"
                        } animate-pulse`}
                      />
                      {isSoundAlertActive ? "Loud!" : soundStatusText}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Link>

          {/* Vibration Sensor Card */}
          <Link href="/vibration" className="group">
            <div className="bg-linear-to-br from-zinc-50 to-slate-50 rounded-3xl p-6 border border-zinc-200 shadow-lg shadow-zinc-100/50 hover:shadow-xl hover:shadow-zinc-100/70 transition-all duration-300 hover:scale-[1.02] h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-zinc-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg shadow-zinc-200">
                  <Mountain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Vibration Sensor
                  </h2>
                  <p className="text-sm text-gray-500">Ground vibration</p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {vibrationLoading ? (
                <div className="animate-pulse">
                  <div className="h-24 bg-zinc-200 rounded-xl mb-4" />
                  <div className="h-6 w-32 bg-zinc-200 rounded" />
                </div>
              ) : (
                <>
                  {/* Vibration Visual */}
                  <div className="h-24 mb-4 flex items-center justify-center">
                    <div className="relative">
                      <div
                        className={`absolute inset-0 rounded-full ${
                          lastVibrationTimestamp &&
                          Date.now() - lastVibrationTimestamp < 60000
                            ? "bg-slate-500/30 animate-ping"
                            : ""
                        }`}
                        style={{ width: "80px", height: "80px" }}
                      />
                      <div className="w-20 h-20 rounded-full bg-linear-to-br from-zinc-100 to-slate-100 flex items-center justify-center relative">
                        <Mountain
                          className={`w-10 h-10 ${
                            lastVibrationTimestamp &&
                            Date.now() - lastVibrationTimestamp < 60000
                              ? "text-slate-700"
                              : "text-zinc-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Last Vibration Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      {lastVibrationTimestamp ? (
                        <>
                          <span className="text-lg font-bold text-gray-800">
                            Last detected
                          </span>
                          <span className="text-zinc-600 font-medium ml-2">
                            {vibrationRelativeTime}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500">
                          No vibration detected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-600">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          lastVibrationTimestamp &&
                          Date.now() - lastVibrationTimestamp < 60000
                            ? "bg-slate-600"
                            : "bg-zinc-500"
                        } animate-pulse`}
                      />
                      {lastVibrationTimestamp &&
                      Date.now() - lastVibrationTimestamp < 60000
                        ? "Active"
                        : "Monitoring"}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Link>

          {/* Flame Sensor Card */}
          <Link href="/flame" className="group">
            <div
              className={`bg-linear-to-br from-red-50 to-rose-50 rounded-3xl p-6 border shadow-lg transition-all duration-300 hover:scale-[1.02] h-full relative ${
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
                <div className="w-12 h-12 bg-linear-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
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

          {/* Temperature Sensor Card */}
          <Link href="/temperature" className="group">
            <div className="bg-linear-to-br from-orange-50 to-amber-50 rounded-3xl p-6 border border-orange-200 shadow-lg shadow-orange-100/50 hover:shadow-xl hover:shadow-orange-100/70 transition-all duration-300 hover:scale-[1.02] h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                  <Thermometer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Temperature
                  </h2>
                  <p className="text-sm text-gray-500">Ambient temperature</p>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {temperatureLoading ? (
                <div className="animate-pulse">
                  <div className="h-24 bg-orange-200 rounded-xl mb-4" />
                  <div className="h-6 w-24 bg-orange-200 rounded" />
                </div>
              ) : (
                <>
                  {/* Mini Chart Preview */}
                  <div className="h-24 mb-4">
                    {temperatureData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={temperatureData}>
                          <defs>
                            <linearGradient
                              id="colorTemperaturePreview"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#f97316"
                                stopOpacity={0.6}
                              />
                              <stop
                                offset="95%"
                                stopColor="#f97316"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="temperature"
                            stroke="#f97316"
                            strokeWidth={2}
                            fill="url(#colorTemperaturePreview)"
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
                        {currentTemperature !== null
                          ? `${currentTemperature}°C`
                          : "—"}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {getTemperatureDescription(currentTemperature)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          temperatureStatusText === "Live"
                            ? "bg-orange-500"
                            : "bg-gray-400"
                        } animate-pulse`}
                      />
                      {temperatureStatusText}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Link>

          {/* Humidity Sensor Card */}
          <Link href="/humidity" className="group">
            <div className="bg-linear-to-br from-sky-50 to-cyan-50 rounded-3xl p-6 border border-sky-200 shadow-lg shadow-sky-100/50 hover:shadow-xl hover:shadow-sky-100/70 transition-all duration-300 hover:scale-[1.02] h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-sky-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Humidity
                  </h2>
                  <p className="text-sm text-gray-500">Air humidity level</p>
                </div>
                <ChevronRight className="w-5 h-5 text-sky-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {humidityLoading ? (
                <div className="animate-pulse">
                  <div className="h-24 bg-sky-200 rounded-xl mb-4" />
                  <div className="h-6 w-24 bg-sky-200 rounded" />
                </div>
              ) : (
                <>
                  {/* Mini Chart Preview */}
                  <div className="h-24 mb-4">
                    {humidityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={humidityData}>
                          <defs>
                            <linearGradient
                              id="colorHumidityPreview"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#38bdf8"
                                stopOpacity={0.6}
                              />
                              <stop
                                offset="95%"
                                stopColor="#38bdf8"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="humidity"
                            stroke="#38bdf8"
                            strokeWidth={2}
                            fill="url(#colorHumidityPreview)"
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
                        {currentHumidity !== null ? `${currentHumidity}%` : "—"}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {getHumidityDescription(currentHumidity)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-sky-500">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          humidityStatusText === "Live"
                            ? "bg-sky-400"
                            : "bg-gray-400"
                        } animate-pulse`}
                      />
                      {humidityStatusText}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Link>

          {/* Soil Moisture Sensor Card */}
          <Link href="/soil-moisture" className="group">
            <div className="bg-linear-to-br from-amber-50 to-yellow-50 rounded-3xl p-6 border border-amber-200 shadow-lg shadow-amber-100/50 hover:shadow-xl hover:shadow-amber-100/70 transition-all duration-300 hover:scale-[1.02] h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-amber-700 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                  <Earth className="w-6 h-6 text-white" />
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

          {/* Gas Sensor Card */}
          <Link href="/gas" className="group">
            <div className="bg-linear-to-br from-gray-50 to-slate-50 rounded-3xl p-6 border border-gray-200 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-100/70 transition-all duration-300 hover:scale-[1.02] h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-gray-500 to-slate-500 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
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
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>🌲 Forest Monitor • Real-time environmental sensing</p>
        </footer>
      </main>
    </div>
  );
}
