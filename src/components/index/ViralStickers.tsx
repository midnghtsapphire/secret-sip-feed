
import React from 'react';

const ViralStickers = () => {
  return (
    <div className="relative z-30 pt-6 pb-4">
      <div className="flex justify-center">
        <div className="flex gap-16 flex-wrap justify-center">
          <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transform rotate-3 hover:rotate-6 transition-transform border border-white animate-bounce">
            <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center mb-0.5 mx-auto">
              <span className="text-[8px]">🔥</span>
            </div>
            VIRAL
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transform -rotate-2 hover:-rotate-6 transition-transform border border-white animate-bounce" style={{ animationDelay: '0.5s' }}>
            <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center mb-0.5 mx-auto">
              <span className="text-[8px]">✨</span>
            </div>
            TRENDING
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViralStickers;
