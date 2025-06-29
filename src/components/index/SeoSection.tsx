
import React from 'react';

const SeoSection = () => {
  return (
    <section className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">About Secret Sips</h2>
      <div className="grid md:grid-cols-2 gap-8 text-gray-600">
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Viral Starbucks Recipes</h3>
          <p className="mb-4">
            Discover the most popular Starbucks secret menu drinks trending on TikTok, Instagram, and Lemon8. 
            From pink drinks to budget-friendly hacks, we've got all the recipes you need.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Budget-Friendly Options</h3>
          <p className="mb-4">
            Save money while still enjoying Instagram-worthy drinks with our Budget Babe Brews collection. 
            All recipes under $5 that taste just as good as the expensive originals.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SeoSection;
