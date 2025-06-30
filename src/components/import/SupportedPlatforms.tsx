
import React from 'react';

const SupportedPlatforms = () => {
  return (
    <div className="mt-8 text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Supported Platforms</h3>
      <div className="flex justify-center gap-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-2">
            <span className="font-bold text-lg">TT</span>
          </div>
          <p className="text-sm text-gray-600">TikTok</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-2">
            <span className="font-bold text-lg">IG</span>
          </div>
          <p className="text-sm text-gray-600">Instagram</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-400 text-black rounded-2xl flex items-center justify-center mx-auto mb-2">
            <span className="font-bold text-lg">L8</span>
          </div>
          <p className="text-sm text-gray-600">Lemon8</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-2">
            <span className="font-bold text-lg">YT</span>
          </div>
          <p className="text-sm text-gray-600">YouTube</p>
        </div>
      </div>
    </div>
  );
};

export default SupportedPlatforms;
