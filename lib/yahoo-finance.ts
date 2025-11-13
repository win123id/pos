export interface StockPriceData {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  currency: string;
  marketState: string;
  companyName?: string;
  recommendation?: {
    buy: number;
    hold: number;
    sell: number;
    strongBuy: number;
    strongSell: number;
    recommendationMean?: number;
    recommendationKey?: string;
  };
}

export async function fetchStockPrice(ticker: string): Promise<StockPriceData | null> {
  try {
    const response = await fetch(`/api/stock-prices?ticker=${encodeURIComponent(ticker)}`);
    
    if (!response.ok) {
      console.error(`Error fetching price for ${ticker}: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    return data as StockPriceData;
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error);
    return null;
  }
}

export async function fetchMultipleStockPrices(tickers: string[]): Promise<Map<string, StockPriceData>> {
  try {
    const response = await fetch('/api/stock-prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tickers }),
    });
    
    if (!response.ok) {
      console.error('Error fetching multiple stock prices:', response.statusText);
      return new Map();
    }
    
    const data = await response.json();
    const priceMap = new Map<string, StockPriceData>();
    
    if (data.prices) {
      Object.entries(data.prices).forEach(([ticker, priceData]) => {
        priceMap.set(ticker, priceData as StockPriceData);
      });
    }
    
    return priceMap;
  } catch (error) {
    console.error('Error fetching multiple stock prices:', error);
    return new Map();
  }
}
