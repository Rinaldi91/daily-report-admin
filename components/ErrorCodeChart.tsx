import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  AlertTriangle,
  TrendingUp,
  Filter,
  RefreshCw,
} from "lucide-react";
import type { TooltipProps } from "recharts";

interface ErrorCodeChartProps {
  medicalDeviceId: string;
}

interface ErrorCodeData {
  errorCodes: { code: string; description?: string }[];
  fullErrorCode: string;
  count: number;
  dates: string[];
}

type ErrorApiItem =
  | string
  | {
      error_code?: string | null;
      date?: string | null;
      created_at?: string | null;
      description?: string | null | undefined; // Add this line
    };
export default function ErrorCodeChart({
  medicalDeviceId,
}: ErrorCodeChartProps) {
  const [errorData, setErrorData] = useState<ErrorCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // Generate year options (current year and 2 years back)
  const yearOptions = Array.from(
    { length: 3 },
    (_, i) => new Date().getFullYear() - i
  );

  // Month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const fetchErrorCodes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL_API}/api/medical-device/error-code?medical_device_id=${medicalDeviceId}&month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${
              document.cookie.split("token=")[1]?.split(";")[0]
            }`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status && Array.isArray(result.data)) {
        const map: Record<
          string,
          {
            fullErrorCode: string;
            errorCodes: { code: string; description?: string }[];
            description?: string;
            count: number;
            date: string;
            dates: string[];
          }
        > = {};

        (result.data as ErrorApiItem[]).forEach((item) => {
          const rawCode =
            typeof item === "string" ? item : item?.error_code ?? "";
          const cleaned = rawCode === "-" ? "No Error" : String(rawCode).trim();
          if (!cleaned) return;

          let dateStr: string | null = null;
          if (typeof item !== "string") {
            dateStr = (item?.date ?? item?.created_at ?? null) || null;
          }
          if (dateStr) dateStr = String(dateStr).slice(0, 10);
          if (!dateStr) return;

          if (!map[dateStr]) {
            const d = new Date(dateStr);
            const formatted = d.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            });
            map[dateStr] = {
              fullErrorCode: "", // provide a default value or calculate it based on the item
              date: formatted, // use the dateStr as the value for the date property
              dates: [dateStr],
              count: 0,
              errorCodes: [],
            };
          }

          map[dateStr].count += 1;
          map[dateStr].errorCodes.push({
            code: cleaned,
            description:
              typeof item !== "string" ? item?.description ?? "" : "",
          });
        });

        const chartData: ErrorCodeData[] = Object.values(map).sort(
          (a, b) =>
            new Date(a.dates[0]).getTime() - new Date(b.dates[0]).getTime()
        );

        setErrorData(chartData);
      } else {
        throw new Error(result.message || "Invalid response format");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
      setErrorData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (medicalDeviceId) {
      fetchErrorCodes();
    }
  }, [medicalDeviceId, selectedMonth, selectedYear]);

  const totalErrors = errorData.reduce((sum, item) => sum + item.count, 0);
  const uniqueErrorTypes = errorData.length;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ErrorCodeData;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-white font-semibold mb-2">{data.dates[0]}</p>
          <p className="text-blue-400 mb-2">
            Total Errors: <span className="font-bold">{data.count}</span>
          </p>
          {data.errorCodes?.length ? (
            <div className="text-xs text-gray-300">
              <p className="mb-1">Error Codes:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {data.errorCodes.map((e, i) => (
                  <li key={i}>
                    {e.code} {e.description && `- ${e.description}`}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-400">Loading error codes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative p-6 bg-gradient-to-r from-gray-700/30 to-gray-800/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>

        <div className="relative flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/30">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Error Code History
              </h3>
              <p className="text-gray-400 font-medium">
                Error frequency over time
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-2 border border-gray-600/30">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-white text-sm outline-none cursor-pointer"
              >
                {monthOptions.map((month) => (
                  <option
                    key={month.value}
                    value={month.value}
                    className="bg-gray-800"
                  >
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-2 border border-gray-600/30">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white text-sm outline-none cursor-pointer"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year} className="bg-gray-800">
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchErrorCodes}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-gray-700/20 to-gray-800/20 border border-gray-600/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div>
                <p className="text-lg font-bold text-white">{totalErrors}</p>
                <p className="text-xs text-gray-400">Total Error</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div>
                <p className="text-lg font-bold text-white">
                  {uniqueErrorTypes}
                </p>
                <p className="text-xs text-gray-400">Error Types</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <div>
                <p className="text-lg font-bold text-white">
                  {monthOptions.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear}
                </p>
                <p className="text-xs text-gray-400">Period</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {errorData.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={errorData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />

                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                />
                <Legend
                  wrapperStyle={{ color: "#9CA3AF", paddingTop: "20px" }}
                />
                <Bar
                  dataKey="count"
                  name="Error Occurrences"
                  fill="url(#errorGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient
                    id="errorGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Error Data
            </h3>
            <p className="text-gray-400 text-center max-w-md">
              No error codes were found for the selected period. Try selecting a
              different month or year.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
