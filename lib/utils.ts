const CMC_API_KEY = process.env.CMC_API_KEY;
if (!CMC_API_KEY) {
  throw new Error('Please add CMC_API_KEY to the .env file');
}

export function addCommasToNumber(number: number): string {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export async function getCroakPrice(): Promise<number> {
  try {
    const url =
      'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=34137';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CMC_PRO_API_KEY': `${CMC_API_KEY}`,
      },
    });
    const jsonData = await response.json();
    return jsonData.data[34137].quote.USD.price;
  } catch (error) {
    throw new Error(`Error in fetching CROAK price: ${error}`);
  }
}
