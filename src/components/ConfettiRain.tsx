
import React from 'react';

const ConfettiRain = () => {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => i);
  
  const colors = [
    'bg-pink-400',
    'bg-purple-400', 
    'bg-blue-400',
    'bg-green-400',
    'bg-yellow-400',
    'bg-red-400',
    'bg-orange-400',
    'bg-indigo-400'
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece}
          className={`absolute w-2 h-2 ${colors[piece % colors.length]} opacity-80`}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        div[class*="bg-"] {
          animation: confetti-fall linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ConfettiRain;
