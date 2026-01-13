'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SearchableSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Search...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term (case-insensitive, matches anywhere)
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
      handleOptionClick(filteredOptions[0]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={isOpen ? searchTerm : value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={isOpen ? placeholder : value || placeholder}
        className="input-field w-full cursor-pointer"
        autoComplete="off"
      />
      
      {/* Dropdown arrow */}
      <div 
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
        aria-hidden="true"
      >
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-gray-800 border border-gray-600 rounded-md shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option}
                onClick={() => handleOptionClick(option)}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-700 ${
                  option === value ? 'bg-gray-700 text-emerald-400' : 'text-white'
                }`}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-400">No matches found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
