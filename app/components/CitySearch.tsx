"use client";

import { useState, useEffect, useRef } from "react";

export interface CityData {
  id: string;
  name: string;
  nameZh: string;
  namePy: string;
  country: string;
  countryName: string;
  countryFlag: string;
  state: string;
  stateName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffset: string;
  priority: number;
}

interface CitySearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (city: CityData) => void;
  placeholder?: string;
}

export function CitySearch({ value, onChange, onSelect, placeholder = "Search city..." }: CitySearchProps) {
  const [cities, setCities] = useState<CityData[]>([]);
  const [results, setResults] = useState<CityData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/cities.json")
      .then((res) => res.json())
      .then((data) => setCities(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const query = value.toLowerCase();
    const filtered = cities
      .filter((city) => {
        return (
          city.name.toLowerCase().includes(query) ||
          city.nameZh.includes(query) ||
          city.namePy.toLowerCase().includes(query) ||
          city.countryName.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6);

    setResults(filtered);
    setShowDropdown(filtered.length > 0);
  }, [value, cities]);

  const handleSelect = (city: CityData) => {
    setSelectedCity(city);
    setShowDropdown(false);
    onChange(city.name);
    onSelect(city);
  };

  const handleClear = () => {
    setSelectedCity(null);
    onChange("");
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (selectedCity) {
    const tzDisplay = selectedCity.timezone.replace("_", " ");
    return (
      <div className="glass card p-4 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{selectedCity.countryFlag}</span>
          <div className="flex-1">
            <p className="text-white font-semibold">{selectedCity.nameZh} {selectedCity.name}</p>
            <p className="text-gray-400 text-sm">
              {selectedCity.stateName ? selectedCity.stateName + ", " : ""}{selectedCity.countryName}
            </p>
            <p className="text-accent text-sm mt-1">
              {selectedCity.utcOffset} {tzDisplay}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-white text-sm"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Search</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface/60 border border-white/10 text-white placeholder-gray-400 focus:border-accent/50 focus:outline-none transition-all"
        />
      </div>
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => handleSelect(city)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
            >
              <span className="mr-2">{city.countryFlag}</span>
              <span className="text-white">{city.name}</span>
              {city.stateName && <span className="text-gray-400 text-sm ml-1">, {city.stateName}</span>}
              <span className="text-gray-500 text-sm ml-1">, {city.countryName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export type { CitySearchProps };
