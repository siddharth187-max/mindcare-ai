import React from 'react';

const MedicalDisclaimer = () => {
  return (
    <footer className="w-full bg-[#EAF2EE] border-t border-[#C8DDD4] py-3.5 px-4 text-center text-[#263B42] text-xs sm:text-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
        <span className="text-base text-[#397F7A]">🌿</span>
        <p className="font-medium text-[#566D75]">
          <strong className="text-[#263B42] font-semibold">MindCare Health Note:</strong> This application is a supportive cognitive and routine companion prototype. It does not replace professional medical diagnosis or personalized clinical care.
        </p>
      </div>
    </footer>
  );
};

export default MedicalDisclaimer;
