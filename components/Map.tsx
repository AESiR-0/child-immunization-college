"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Search, MapPin, Loader2, AlertCircle, CheckCircle, Navigation } from "lucide-react";

// Fix for missing default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

type HealthCenter = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

export default function HealthCentersByPincode() {
  const [pincode, setPincode] = useState("");
  const [centerCoords, setCenterCoords] = useState<[number, number] | null>(
    null
  );
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);

  // Auto-fetch location on component mount
  useEffect(() => {
    autoDetectLocation();
  }, []);

  // Auto-detect user's location
  const autoDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords: [number, number] = [latitude, longitude];
        setCenterCoords(coords);

        // Reverse geocode to get pincode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
          );
          const data = await res.json();
          
          if (data.address && data.address.postcode) {
            const detectedPincode = data.address.postcode;
            setPincode(detectedPincode);
            setAutoDetected(true);
            await fetchHealthCenters(latitude, longitude);
          } else {
            // If no pincode found, still use the coordinates
            setPincode("");
            await fetchHealthCenters(latitude, longitude);
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          // Still fetch health centers even if reverse geocoding fails
          await fetchHealthCenters(latitude, longitude);
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocating(false);
        setError("Unable to detect your location. Please enter a pincode manually.");
      }
    );
  };

  // Step 1: Convert Pincode → Coordinates (Geocoding)
  const fetchCoordinates = async (code: string) => {
    if (!code.trim()) {
      setError("Please enter a valid pincode.");
      return;
    }

    setLoading(true);
    setError("");
    setHealthCenters([]);
    setAutoDetected(false);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${code}&country=India&format=json`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setCenterCoords(coords);
        await fetchHealthCenters(coords[0], coords[1]);
      } else {
        setError("Could not find location for this pincode. Please try another.");
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      setError("Something went wrong while fetching location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Fetch nearby health centers using Overpass API
  const fetchHealthCenters = async (lat: number, lon: number) => {
    const overpassQuery = `
      [out:json];
      (
        node["amenity"="hospital"](around:10000,${lat},${lon});
        node["amenity"="clinic"](around:10000,${lat},${lon});
        node["amenity"="doctors"](around:10000,${lat},${lon});
      );
      out center;
    `;

    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: overpassQuery,
      });
      const json = await res.json();

      const centers = json.elements.map((el: any) => ({
        id: el.id,
        name: el.tags.name || "Unnamed Health Center",
        lat: el.lat,
        lon: el.lon,
      }));

      setHealthCenters(centers);
      if (centers.length === 0) {
        setError("No health centers found in this area. Try a different location.");
      } else {
        setError(""); // Clear error if centers found
      }
    } catch (error) {
      console.error("Error fetching health centers:", error);
      setError("Failed to load health centers. Try again later.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      fetchCoordinates(pincode);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Search Section */}
      <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            Search by Pincode
          </label>
          <button
            onClick={autoDetectLocation}
            disabled={locating}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                Use My Location
              </>
            )}
          </button>
        </div>
        {autoDetected && (
          <div className="mb-3 bg-green-50 border-2 border-green-200 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4" />
            Location detected automatically
          </div>
        )}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-black placeholder:text-gray-400 bg-white/80 hover:bg-white"
              placeholder="Enter 6-digit pincode (e.g., 110001)"
              maxLength={6}
            />
          </div>
          <button
            onClick={() => fetchCoordinates(pincode)}
            disabled={loading || !pincode.trim()}
            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 min-w-[140px] justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm shadow-sm">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        {healthCenters.length > 0 && !error && (
          <div className="mt-4 bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm shadow-sm">
            <CheckCircle className="w-5 h-5" />
            Found {healthCenters.length} health center{healthCenters.length !== 1 ? "s" : ""} within 10km
          </div>
        )}
      </div>

      {/* Map */}
      <div className="w-full h-[600px] rounded-2xl overflow-hidden border-2 border-purple-200 shadow-2xl">
        {centerCoords ? (
          <MapContainer
            center={centerCoords}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            />

            {/* Center Marker */}
            <Marker position={centerCoords}>
              <Popup>
                <div className="text-center">
                  <strong className="text-purple-600">Your Location</strong>
                  <br />
                  {pincode && <span className="text-sm">Pincode: {pincode}</span>}
                </div>
              </Popup>
            </Marker>

            {/* 10 km Radius Circle */}
            <Circle
              center={centerCoords}
              radius={10000}
              color="#8B5CF6"
              fillColor="#8B5CF6"
              fillOpacity={0.1}
            />

            {/* Health Centers */}
            {healthCenters.map((hc) => (
              <Marker key={hc.id} position={[hc.lat, hc.lon]}>
                <Popup>
                  <div>
                    <strong className="text-green-700">{hc.name}</strong>
                    <br />
                    <span className="text-sm text-gray-600">
                      Vaccination Center
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-purple-50">
            <div className="text-center p-8">
              {locating ? (
                <>
                  <Loader2 className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
                  <p className="text-xl font-bold text-gray-700 mb-2">
                    Detecting Your Location...
                  </p>
                  <p className="text-gray-600">
                    Please allow location access in your browser
                  </p>
                </>
              ) : (
                <>
                  <div className="bg-purple-600 p-4 rounded-full w-fit mx-auto mb-4 shadow-lg">
                    <MapPin className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-xl font-bold text-gray-700 mb-2">
                    Ready to Search
                  </p>
                  <p className="text-gray-600">
                    Click "Use My Location" or enter a pincode to find nearby vaccination centers
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
