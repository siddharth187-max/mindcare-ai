import React from 'react';

const LoadingSpinner = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5DC]">
      <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-t-4 border-[#2E7D32]"></div>
      {message && (
        <p className="mt-6 text-3xl font-semibold text-[#2E7D32]">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
