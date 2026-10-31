export function weatherDescription(code: number, isDay = true): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear sky', icon: isDay ? '☀' : '☾' };
  if (code === 1 || code === 2) return { label: 'Partly cloudy', icon: '⛅' };
  if (code === 3) return { label: 'Overcast', icon: '☁' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: '≋' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', icon: '☂' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain', icon: '☂' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', icon: '❄' };
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: 'ϟ' };
  return { label: 'Weather', icon: '○' };
}

export function windDirection(degrees: number): string {
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(degrees / 45) % 8];
}
