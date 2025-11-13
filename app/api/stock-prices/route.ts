import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

const yahoo = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

interface StockPriceData {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  currency: string;
  marketState: string;
  companyName?: string;
}

interface YahooFinanceResult {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  currency?: string;
  marketState?: string;
  longName?: string;
  shortName?: string;
}

async function fetchStockPrice(ticker: string): Promise<StockPriceData | null> {
  try {
    const result = await yahoo.quote(ticker) as YahooFinanceResult;
    
    return {
      symbol: result.symbol || ticker,
      regularMarketPrice: result.regularMarketPrice || 0,
      regularMarketChange: result.regularMarketChange || 0,
      regularMarketChangePercent: result.regularMarketChangePercent || 0,
      currency: result.currency || 'USD',
      marketState: result.marketState || 'CLOSED',
      companyName: result.longName || result.shortName || ''
    };
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tickers } = await request.json();
    
    if (!tickers || !Array.isArray(tickers)) {
      return NextResponse.json({ error: 'Invalid tickers array' }, { status: 400 });
    }

    const priceMap = new Map<string, StockPriceData>();
    
    // Process tickers in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);
      const promises = batch.map(async (ticker: string) => {
        const priceData = await fetchStockPrice(ticker);
        if (priceData) {
          priceMap.set(ticker, priceData);
        }
      });
      
      await Promise.all(promises);
      
      // Add small delay between batches to be respectful to Yahoo Finance
      if (i + batchSize < tickers.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return NextResponse.json({ prices: Object.fromEntries(priceMap) });
  } catch (error) {
    console.error('Error in stock price API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    
    if (!ticker) {
      return NextResponse.json({ error: 'Ticker parameter required' }, { status: 400 });
    }

    const priceData = await fetchStockPrice(ticker);
    
    if (!priceData) {
      return NextResponse.json({ error: 'Failed to fetch price' }, { status: 404 });
    }
    
    return NextResponse.json(priceData);
  } catch (error) {
    console.error('Error in single stock price API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
