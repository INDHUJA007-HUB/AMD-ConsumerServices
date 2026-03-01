import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'your_mapbox_token_here';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    coordinates: [number, number];
    title: string;
    description?: string;
  }>;
  height?: string;
  selectedMarker?: {
    coordinates: [number, number];
    title: string;
    description?: string;
  } | null;
}

const CoimbatoreSmartMap = ({
  center = [76.9558, 11.0168],
  zoom = 12,
  markers = [],
  height = '500px',
  selectedMarker = null
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: center,
      zoom: zoom,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      markersRef.current.forEach(m => m.remove());
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    map.current.flyTo({
      center: center,
      zoom: selectedMarker ? 17 : zoom,
      duration: 1500,
      essential: true
    });
  }, [center, zoom, selectedMarker]);

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (selectedMarker) {
      const el = document.createElement('div');
      el.className = 'selected-marker-pulse';
      el.style.cssText = `
        width: 40px;
        height: 40px;
        background: radial-gradient(circle, #ef4444 0%, #dc2626 100%);
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6), 0 0 0 0 rgba(239, 68, 68, 0.7);
        cursor: pointer;
        animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        className: 'custom-popup'
      }).setHTML(
        `<div style="padding: 12px; min-width: 200px;">
          <h3 style="font-weight: 700; margin-bottom: 6px; color: #1f2937; font-size: 14px;">${selectedMarker.title}</h3>
          ${selectedMarker.description ? `<p style="font-size: 12px; color: #6b7280; margin: 0;">${selectedMarker.description}</p>` : ''}
        </div>`
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(selectedMarker.coordinates)
        .setPopup(popup)
        .addTo(map.current);

      setTimeout(() => marker.togglePopup(), 800);
      markersRef.current.push(marker);
    } else {
      markers.forEach((marker, idx) => {
        const el = document.createElement('div');
        el.className = 'marker-fade-in';
        el.style.cssText = `
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          cursor: pointer;
          transition: all 0.3s ease;
          animation: fadeInScale 0.5s ease-out ${idx * 0.02}s both;
        `;

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.3)';
          el.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.6)';
        });

        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.4)';
        });

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          className: 'custom-popup'
        }).setHTML(
          `<div style="padding: 10px;">
            <h3 style="font-weight: 600; margin-bottom: 4px; color: #1f2937; font-size: 13px;">${marker.title}</h3>
            ${marker.description ? `<p style="font-size: 11px; color: #6b7280; margin: 0;">${marker.description}</p>` : ''}
          </div>`
        );

        const mapMarker = new mapboxgl.Marker({ element: el })
          .setLngLat(marker.coordinates)
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(mapMarker);
      });
    }
  }, [markers, selectedMarker]);

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6), 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          50% {
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6), 0 0 0 15px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6), 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
        
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .custom-popup .mapboxgl-popup-content {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          padding: 0;
          animation: popupSlideIn 0.3s ease-out;
        }
        
        @keyframes popupSlideIn {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .custom-popup .mapboxgl-popup-tip {
          border-top-color: white;
        }
      `}</style>
      <div ref={mapContainer} style={{ width: '100%', height }} className="rounded-lg shadow-lg" />
    </>
  );
};

export default CoimbatoreSmartMap;
