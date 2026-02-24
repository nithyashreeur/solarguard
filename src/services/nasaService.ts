import { WeatherData } from '../types';

// Note: The NASA POWER API generally does not require an API key for basic temporal point requests.
// If you have a specific API key or token, you can append it to the URL as a query parameter.
// Example: const apiKey = process.env.NASA_POWER_API_KEY;

export async function fetchNasaPowerData(lat: number, lon: number): Promise<WeatherData> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 2); // Use 2 days ago to ensure data availability
  
  const dateStr = yesterday.toISOString().split('T')[0].replace(/-/g, '');
  
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN,PRECTOTCORR,T2M&community=RE&longitude=${lon}&latitude=${lat}&start=${dateStr}&end=${dateStr}&format=JSON`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error('NASA API request failed');
    const data = await response.json();
    
    const properties = data.properties?.parameter;
    if (!properties) throw new Error('Invalid NASA data structure');

    const solarInsolation = properties.ALLSKY_SFC_SW_DWN?.[dateStr] ?? properties.ALLSKY_SFC_SW_DWN?.[Object.keys(properties.ALLSKY_SFC_SW_DWN)[0]];
    const precipitation = properties.PRECTOTCORR?.[dateStr] ?? properties.PRECTOTCORR?.[Object.keys(properties.PRECTOTCORR)[0]];
    const temperature = properties.T2M?.[dateStr] ?? properties.T2M?.[Object.keys(properties.T2M)[0]];

    return {
      solarInsolation: (solarInsolation === -999 || solarInsolation === undefined) ? 4.5 : solarInsolation,
      precipitation: (precipitation === -999 || precipitation === undefined) ? 0 : precipitation,
      temperature: (temperature === -999 || temperature === undefined) ? 25 : temperature,
    };
  } catch (error) {
    console.error('Error fetching NASA data:', error);
    // Return sensible defaults if API fails or times out
    return {
      solarInsolation: 4.5,
      precipitation: 0,
      temperature: 25,
    };
  }
}
