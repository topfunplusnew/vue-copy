// /src/components/geolocationService.js
export async function getReverseGeocoding(lat: number, lon: number) {
  // 使用 OpenStreetMap Nominatim API 进行反向地理编码
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('反向地理编码请求失败');
  }
  const data = await response.json();
  const address = data.address;
  // 尝试提取城市信息（有时返回的是 town/village/county）
  const city = address.city || address.town || address.village || address.county || '';
  const country = address.country || '';
  let flagUrl = '';
  if (country) {
    try {
      // 通过 Rest Countries API 获取国家国旗
      const flagResponse = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=true`);
      if (flagResponse.ok) {
        const countryData = await flagResponse.json();
        flagUrl = countryData[0]?.flags?.svg || countryData[0]?.flags?.png || '';
      }
    } catch (err) {
      console.error('获取国旗失败:', err);
    }
  }
  return { city, country, flagUrl };
}



export function extractCountryAndCity(address:string) {
  if (!address) return [];

  const cleanStr = address.replace(/\s+/g, '');

  // 匹配“XX国”
  const countryMatch = cleanStr.match(/[\u4e00-\u9fa5]+国/);
  const country = countryMatch ? countryMatch[0] : null;

  // 匹配第一个“XX市”，但要在国家之后再找
  const rest = country ? cleanStr.slice(cleanStr.indexOf(country) + country.length) : cleanStr;
  const cityMatch = rest.match(/[\u4e00-\u9fa5]+市/);
  const city = cityMatch ? cityMatch[0] : null;

  return [country, city].filter(Boolean);
}

