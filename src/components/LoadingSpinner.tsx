import React from 'react';

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center space-x-2 text-gray-400">
      <div className="animate-spin">
        <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
      </div>
      <span>{message}</span>
    </div>
  );
};

export default LoadingSpinner;