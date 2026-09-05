import React from 'react';

const LoadingSpinner = ({ message = "Loading MindCare..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-[#F7F3E8]">
      <div className="w-14 h-14 rounded-full border-4 border-[#8DB7A5] border-t-[#397F7A] animate-spin mb-4"></div>
      <p className="text-xl font-bold text-[#263B42]">
        {message}
      </p>
      <p className="text-sm text-[#566D75] mt-1 font-medium">
        Please take your time...
      </p>
    </div>
  );
};

export default LoadingSpinner;
