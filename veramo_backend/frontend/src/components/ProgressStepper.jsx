import React from 'react';

const ProgressStepper = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Linha de conexão */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div 
            className="h-full bg-gradient-to-r from-[#bfa15a] to-[#23281a] transition-all duration-500"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && (isCompleted || isCurrent);

          return (
            <div key={index} className="flex flex-col items-center">
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
                  transition-all duration-300 transform hover:scale-110
                  ${isCompleted 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : isCurrent 
                      ? 'bg-[#bfa15a] text-white shadow-lg ring-4 ring-[#bfa15a]/20' 
                      : 'bg-gray-200 text-gray-500'
                  }
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {isCompleted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </button>
              
              <div className="mt-3 text-center">
                <div className={`text-sm font-semibold ${
                  isCurrent ? 'text-[#bfa15a]' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className={`text-xs mt-1 ${
                  isCurrent ? 'text-[#23281a]' : 'text-gray-400'
                }`}>
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressStepper;
