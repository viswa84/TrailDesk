import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

export default function DatePickerInput({
    selected,
    onChange,
    placeholderText = "dd/mm/yyyy",
    className = "input-field w-full",
    minDate,
    maxDate,
    required = false
}) {
    return (
        <div className="relative w-full">
            <DatePicker
                selected={selected}
                onChange={onChange}
                dateFormat="dd/MM/yyyy"
                placeholderText={placeholderText}
                className={className}
                minDate={minDate}
                maxDate={maxDate}
                required={required}
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
    );
}
