import { useEffect, useMemo, useState } from "react";

type City = {
  name: string;
  latitude: number;
  longitude: number;
};

type CityWeather = {
  city: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  maxTemp: number;
  minTemp: number;
  rainChance: number;
  weatherCode: number;
  updatedAt: string;
};

const CITIES: City[] = [
  { name: "Belo Horizonte", latitude: -19.9167, longitude: -43.9345 },
  { name: "Uberlandia", latitude: -18.9141, longitude: -48.2754 },
  { name: "Juiz de Fora", latitude: -21.7608, longitude: -43.3496 },
  { name: "Montes Claros", latitude: -16.7286, longitude: -43.8578 },
  { name: "Ouro Preto", latitude: -20.3856, longitude: -43.5036 },
  { name: "Varginha", latitude: -21.5514, longitude: -45.4303 },
];

const weatherLabel = (code: number) => {
  if (code === 0) return "Ceu limpo";
  if ([1, 2].includes(code)) return "Parcialmente nublado";
  if (code === 3) return "Nublado";
  if ([45, 48].includes(code)) return "Nevoeiro";
  if ([51, 53, 55, 56, 57].includes(code)) return "Garoa";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Chuva";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Granizo/Neve";
  if ([95, 96, 99].includes(code)) return "Tempestade";
  return "Variavel";
};

const weatherEmoji = (code: number) => {
  if (code === 0) return "☀";
  if ([1, 2].includes(code)) return "⛅";
  if (code === 3) return "☁";
  if ([45, 48].includes(code)) return "🌫";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧";
  if ([95, 96, 99].includes(code)) return "⛈";
  return "🌤";
};

export default function App() {
  const [weather, setWeather] = useState<CityWeather[]>([]);
  const [selectedCity, setSelectedCity] = useState(CITIES[0].name);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWeather = async () => {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all(
        CITIES.map(async (city) => {
          const params = new URLSearchParams({
            latitude: String(city.latitude),
            longitude: String(city.longitude),
            current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
            daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            timezone: "America/Sao_Paulo",
            forecast_days: "1",
          });

          const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
          if (!response.ok) {
            throw new Error(`Erro ao carregar ${city.name}`);
          }

          const data = await response.json();

          return {
            city: city.name,
            temperature: data.current.temperature_2m,
            apparentTemperature: data.current.apparent_temperature,
            humidity: data.current.relative_humidity_2m,
            windSpeed: data.current.wind_speed_10m,
            maxTemp: data.daily.temperature_2m_max[0],
            minTemp: data.daily.temperature_2m_min[0],
            rainChance: data.daily.precipitation_probability_max[0],
            weatherCode: data.current.weather_code,
            updatedAt: data.current.time,
          } as CityWeather;
        }),
      );

      setWeather(responses);
    } catch {
      setError("Nao foi possivel atualizar os dados. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

  const selectedWeather = useMemo(
    () => weather.find((item) => item.city === selectedCity) ?? weather[0],
    [selectedCity, weather],
  );

  const avgTemp = useMemo(() => {
    if (!weather.length) return 0;
    return weather.reduce((acc, item) => acc + item.temperature, 0) / weather.length;
  }, [weather]);

  const hottest = useMemo(() => {
    if (!weather.length) return null;
    return [...weather].sort((a, b) => b.maxTemp - a.maxTemp)[0];
  }, [weather]);

  const cityButtons: Array<{ city: string; temperature?: number }> = weather.length
    ? weather.map((item) => ({ city: item.city, temperature: item.temperature }))
    : CITIES.map((city) => ({ city: city.name }));

  return (
    <div className="sky-background min-h-screen text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 lg:py-10">
        <header className="weather-hero overflow-hidden rounded-2xl border border-sky-300/30 p-6 shadow-[0_20px_60px_rgba(2,132,199,0.25)] md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-sky-100/80">Minas Gerais</p>
              <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Dashboard do Clima</h1>
              <p className="mt-2 max-w-2xl text-sky-50/90">
                Condicoes em tempo real para cidades mineiras, com atualizacao direta da API Open-Meteo.
              </p>
            </div>

            <button
              onClick={loadWeather}
              className="rounded-md border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              Atualizar agora
            </button>
          </div>
        </header>

        {error ? (
          <p className="mt-5 rounded-md border border-rose-300/40 bg-rose-500/20 px-4 py-3 text-sm text-rose-100">{error}</p>
        ) : null}

        <main className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <section className="rounded-xl border border-sky-200/70 bg-white/65 p-4 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-900">Cidades</h2>
              <span className="text-xs text-sky-700">{weather.length || CITIES.length} locais</span>
            </div>

            <div className="space-y-2">
              {cityButtons.map((item) => {
                const cityName = item.city;
                const isActive = cityName === selectedCity;

                return (
                  <button
                    key={cityName}
                    onClick={() => setSelectedCity(cityName)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? "bg-sky-500/20 text-sky-950"
                        : "text-sky-900 hover:-translate-y-0.5 hover:bg-white/60 hover:text-sky-950"
                    }`}
                  >
                    <span>{cityName}</span>
                    <span className="text-xs text-sky-700">{item.temperature !== undefined ? `${Math.round(item.temperature)}°C` : "--"}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-xl border border-sky-200/70 bg-white/65 p-5 backdrop-blur-sm md:p-6">
              {loading || !selectedWeather ? (
                <div className="space-y-3">
                  <div className="h-9 w-44 animate-pulse rounded bg-slate-700" />
                  <div className="h-20 w-52 animate-pulse rounded bg-slate-800" />
                  <div className="h-5 w-60 animate-pulse rounded bg-slate-700" />
                </div>
              ) : (
                <>
                  <p className="text-sm uppercase tracking-widest text-sky-700">Agora em {selectedWeather.city}</p>
                  <div className="mt-3 flex flex-wrap items-end gap-4">
                    <p className="temperature-pop text-7xl font-semibold leading-none text-sky-950">
                      {Math.round(selectedWeather.temperature)}°
                    </p>
                    <div className="pb-2">
                      <p className="text-2xl">{weatherEmoji(selectedWeather.weatherCode)}</p>
                      <p className="text-sm text-sky-800">{weatherLabel(selectedWeather.weatherCode)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-sky-900">
                    Sensacao de {Math.round(selectedWeather.apparentTemperature)}°C, umidade em {selectedWeather.humidity}% e
                    vento de {Math.round(selectedWeather.windSpeed)} km/h.
                  </p>
                </>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-sky-200/70 bg-white/65 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider text-sky-700">Media Estadual</p>
                <p className="mt-2 text-3xl font-semibold text-sky-950">{Math.round(avgTemp)}°C</p>
              </div>
              <div className="rounded-lg border border-sky-200/70 bg-white/65 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider text-sky-700">Maior Maxima Hoje</p>
                <p className="mt-2 text-xl font-semibold text-sky-950">{hottest ? `${hottest.city} (${Math.round(hottest.maxTemp)}°C)` : "--"}</p>
              </div>
              <div className="rounded-lg border border-sky-200/70 bg-white/65 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider text-sky-700">Ultima Leitura</p>
                <p className="mt-2 text-xl font-semibold text-sky-950">
                  {selectedWeather ? new Date(selectedWeather.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-sky-200/70 bg-white/65 p-5 backdrop-blur-sm md:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-900">Comparativo de temperatura maxima</h2>
              <div className="mt-4 space-y-3">
                {weather.map((item) => {
                  const width = Math.min(100, Math.max(10, (item.maxTemp / 40) * 100));
                  return (
                    <div key={item.city}>
                      <div className="mb-1 flex items-center justify-between text-sm text-sky-900">
                        <span>{item.city}</span>
                        <span>{Math.round(item.maxTemp)}°C</span>
                      </div>
                      <div className="h-2 rounded-full bg-sky-100">
                        <div
                          className="h-full rounded-full bg-cyan-400 transition-[width] duration-700"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
