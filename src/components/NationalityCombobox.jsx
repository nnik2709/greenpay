import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { countries } from '@/lib/countries';

/**
 * Nationality Select with Search
 *
 * Searchable dropdown for selecting nationality/country
 *
 * @param {string} value - Currently selected nationality
 * @param {function} onChange - Callback when nationality changes
 * @param {boolean} disabled - Whether the select is disabled
 * @param {string} placeholder - Placeholder text
 */
export function NationalityCombobox({ value, onChange, disabled = false, placeholder = "Select nationality..." }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCountries = countries.filter(country =>
    country.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-12 text-base border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 sticky top-0 bg-white border-b">
          <Input
            type="text"
            placeholder="Search nationality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredCountries.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">
              No nationality found.
            </div>
          ) : (
            filteredCountries.map((country) => (
              <SelectItem key={country.value} value={country.value}>
                {country.label}
              </SelectItem>
            ))
          )}
        </div>
      </SelectContent>
    </Select>
  );
}

export default NationalityCombobox;
