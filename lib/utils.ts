const CMC_API_KEY = process.env.CMC_API_KEY;
if (!CMC_API_KEY) {
  throw new Error('Please add CMC_API_KEY to the .env file');
}

export function addCommasToNumber(number: number): string {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export async function getCroakPrice(): Promise<number> {
  try {
    const cmcTokenId = 34137; // coinmarketcap token id for CROAK on Linea
    const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${cmcTokenId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CMC_PRO_API_KEY': `${CMC_API_KEY}`,
      },
    });
    const jsonData = await response.json();
    const priceDecimal = jsonData.data[cmcTokenId].quote.USD.price;
    const croakPrice = priceDecimal.toFixed(12);
    console.log(`CROAK price: $${croakPrice}`);
    return croakPrice;
  } catch (error) {
    throw new Error(`Error in fetching CROAK price: ${error}`);
  }
}

export async function amountToCroak(amount: number): Promise<number> {
  const croakPrice: number = await getCroakPrice();

  const croakAmount = Number((amount / croakPrice).toFixed(3));
  console.log(`CROAK Amount: ${croakAmount}`);

  return croakAmount;
}
