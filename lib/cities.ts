import type { CityData } from "../app/components/CitySearch";

export type { CityData };

let citiesCache: CityData[] | null = null;

export async function getCities(): Promise<CityData[]> {
  if (citiesCache !== null) return citiesCache;
  const res = await fetch("/data/cities.json");
  if (!res.ok) throw new Error("Failed to load cities data");
  const data: CityData[] = await res.json();
  citiesCache = data;
  return data;
}

export function searchCities(cities: CityData[], query: string, limit = 6): CityData[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return cities
    .filter((city) =>
      city.name.toLowerCase().includes(q) ||
      city.nameZh.includes(q) ||
      city.namePy.toLowerCase().includes(q) ||
      city.countryName.toLowerCase().includes(q)
    )
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}
