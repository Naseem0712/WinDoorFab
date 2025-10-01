import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronUpDownIcon } from './Icons';

interface SearchableSelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => options.find(opt => opt.value === value), [options, value]);

  useEffect(() => {
    setSearchTerm(selectedOption ? selectedOption.label : '');
  }, [selectedOption]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm || (selectedOption && searchTerm === selectedOption.label)) {
      return options;
    }
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, options, selectedOption]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    const newSelected = options.find(opt => opt.value === optionValue);
    if (newSelected) {
        setSearchTerm(newSelected.label);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term to the selected option's label if user clicks away without selecting
        setSearchTerm(selectedOption ? selectedOption.label : '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedOption]);

  return (
    <div ref={containerRef}>
      <label className="block text-gray-400 text-xs mb-1">{label}</label>
      <div className="relative">
        <div className="w-full h-10 p-2 bg-gray-800/50 border border-gray-700 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors flex items-center pr-8">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={(e) => {
                setIsOpen(true);
                e.target.select();
              }}
              onClick={() => setIsOpen(true)}
              className="w-full h-full bg-transparent border-none focus:ring-0 p-0 text-white"
            />
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-white"
          aria-label="Toggle options"
        >
          <ChevronUpDownIcon className="w-5 h-5" />
        </button>

        {isOpen && (
          <ul className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto hide-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-600 ${
                    value === option.value ? 'bg-blue-700 text-white' : 'text-gray-300'
                  }`}
                >
                  {option.label}
                </li>
              ))
            ) : (
                <li className="px-3 py-2 text-sm text-gray-500">No profiles found.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;
