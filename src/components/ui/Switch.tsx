import { FC } from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const Switch: FC<SwitchProps> = ({ checked, onChange, label }) => {
  return (
    <label className="flex items-center cursor-pointer">
      {label && <span className="mr-3 text-gray-200">{label}</span>}
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div 
          className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out ${
            checked ? 'bg-green-600' : 'bg-red-600'
          }`} 
        />
        <div
          className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </div>
    </label>
  );
};
