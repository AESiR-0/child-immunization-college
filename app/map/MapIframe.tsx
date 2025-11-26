"use client";

import { useState, useEffect } from "react";
import { Navigation, MapPin } from "lucide-react";

export default function MapIframe() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setLoading(false);
        },
        () => {
          // If location access denied, use default (India - Delhi)
          setUserLocation({ lat: 28.6139, lon: 77.2090 });
          setLoading(false);
        }
      );
    } else {
      // Default to India - Delhi if geolocation not supported
      setUserLocation({ lat: 28.6139, lon: 77.2090 });
      setLoading(false);
    }
  }, []);

  if (loading || !userLocation) {
    return (
      <div className="w-full h-[500px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Google Maps embed URL - standard embed format
  // Shows vaccination centers near the user's location
  const mapUrl = `https://maps.google.com/maps?q=vaccination+center&t=&z=13&ie=UTF8&iwloc=&output=embed&ll=${userLocation.lat},${userLocation.lon}`;

  return (
    <div className="space-y-4">
      <div className="w-full h-[500px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
        />
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin className="w-4 h-4" />
        <span>Map centered near your location. Search for "vaccination center" to find nearby clinics.</span>
      </div>
    </div>
  );
}

