import React from 'react';

interface LoadingSpinnerProps {
  isVisible: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
