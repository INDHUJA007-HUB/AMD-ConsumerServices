import React, { useState } from 'react';
import { Navigation } from 'lucide-react';
import SmartRouteModal from '../SmartRouteModal';

interface SmartRouteButtonProps {
  destination: string;
  coordinates?: [number, number];
  origin?: string;
  originCoords?: [number, number];
}

export function SmartRouteButton({ destination, coordinates, origin, originCoords }: SmartRouteButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black hover:bg-blue-700 transition-all shadow-sm shadow-blue-100 whitespace-nowrap active:scale-95"
      >
        <Navigation className="w-3 h-3" />
        Smart Route
      </button>

      <SmartRouteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        destination={destination}
        coordinates={coordinates}
        origin={origin}
        originCoords={originCoords}
      />
    </>
  );
}