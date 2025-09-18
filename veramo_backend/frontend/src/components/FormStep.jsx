import React from 'react';

const FormStep = ({ title, description, icon, children, isActive, isCompleted }) => {
  return (
    <div className={`transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute inset-0'}`}>
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        {/* Header do Step */}
        <div className="flex items-center space-x-4 mb-8">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isCompleted 
              ? 'bg-green-100 text-green-600' 
              : isActive 
                ? 'bg-[#bfa15a] text-white' 
                : 'bg-gray-100 text-gray-400'
          }`}>
            {isCompleted ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              icon
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#23281a]">{title}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>
        </div>

        {/* Conteúdo do Step */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FormStep;
