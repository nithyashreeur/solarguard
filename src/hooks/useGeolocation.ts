import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lon: longitude });

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          const data = await response.json();
          const name = data.display_name || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          setLocationName(name);
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        }
      },
      (err) => {
        setError(err.message);
      }
    );
  }, []);

  return { location, locationName, error };
}
