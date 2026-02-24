import * as React from "react";

interface PersonalRecordCardProps {
  title: string;
  value?: string | number;
  unit?: string;
  description?: string;
}

export const PersonalRecordCard: React.FC<PersonalRecordCardProps> = ({
  title,
  value,
  unit,
  description,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl border border-gray-100 transform transition-transform duration-300 hover:scale-105">
      <p className="text-sm font-semibold text-gray-400 mb-2">{title}</p>
      <h3 className="text-3xl font-extrabold text-slate-700 tracking-tight">
        {value !== null && value !== undefined ? (
          <>
            {value}
            {unit && (
              <span className="text-xl font-semibold text-brand-500 ml-1">
                {unit}
              </span>
            )}
          </>
        ) : (
          <span className="text-3xl text-gray-400">-</span>
        )}
      </h3>
      {description && (
        <p className="mt-2 text-xs text-gray-400 text-center">{description}</p>
      )}
    </div>
  );
};
