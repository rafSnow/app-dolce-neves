import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Selecione...", 
  className = "",
  error = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white flex justify-between items-center text-left border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-dolce-rosa/50 transition-all ${
          error ? 'border-rose-400' : 'border-gray-200 focus:border-dolce-rosa'
        } ${!selectedOption ? 'text-dolce-marrom/60' : 'text-dolce-marrom'}`}
      >
        <span className="truncate pr-2">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown/Popover */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Search Input */}
          <div className="p-2 border-b border-gray-50 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-dolce-marrom focus:outline-none focus:border-dolce-rosa focus:ring-1 focus:ring-dolce-rosa transition-all"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 font-medium">
                Nenhum resultado encontrado.
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    value === opt.value 
                      ? 'bg-dolce-rosa-claro/50 text-dolce-marrom font-bold' 
                      : 'text-dolce-marrom hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check className="w-4 h-4 text-dolce-rosa shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
