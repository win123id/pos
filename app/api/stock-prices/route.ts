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

interface YahooFinanceResult {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  currency?: string;
  marketState?: string;
  longName?: string;
  shortName?: string;
  recommendationTrend?: Array<{
    period?: string;
    strongBuy?: number;
    buy?: number;
    hold?: number;
    sell?: number;
    strongSell?: number;
  }>;
  recommendationMean?: number;
  recommendationKey?: string;
}

async function fetchStockPrice(ticker: string): Promise<StockPriceData | null> {
  try {
    // Fetch both quote and recommendation data
    const [quoteResult, recommendationResult] = await Promise.allSettled([
      yahoo.quote(ticker) as YahooFinanceResult,
      yahoo.quoteSummary(ticker, { modules: ['recommendationTrend'] }) as any
    ]);
    
    const result = quoteResult.status === 'fulfilled' ? quoteResult.value : null;
    const recommendationData = recommendationResult.status === 'fulfilled' ? recommendationResult.value : null;
    
    // Get the latest recommendation trend from the recommendationTrend module
    const latestRecommendation = recommendationData?.recommendationTrend?.trend?.[0];
    
    if (!result) {
      throw new Error('Failed to fetch quote data');
    }
    
    // Calculate recommendation based on analyst counts
    let calculatedRecommendationKey = undefined;
    if (latestRecommendation) {
      const { strongBuy = 0, buy = 0, hold = 0, sell = 0, strongSell = 0 } = latestRecommendation;
      const totalAnalysts = strongBuy + buy + hold + sell + strongSell;
      
      if (totalAnalysts > 0) {
        const buyScore = strongBuy + buy;
        const sellScore = sell + strongSell;
        
        if (buyScore > sellScore && buyScore > hold) {
          calculatedRecommendationKey = strongBuy > buy ? 'strong_buy' : 'buy';
        } else if (sellScore > buyScore && sellScore > hold) {
          calculatedRecommendationKey = strongSell > sell ? 'strong_sell' : 'sell';
        } else {
          calculatedRecommendationKey = 'hold';
        }
      }
    }
    
    return {
      symbol: result.symbol || ticker,
      regularMarketPrice: result.regularMarketPrice || 0,
      regularMarketChange: result.regularMarketChange || 0,
      regularMarketChangePercent: result.regularMarketChangePercent || 0,
      currency: result.currency || 'USD',
      marketState: result.marketState || 'CLOSED',
      companyName: result.longName || result.shortName || '',
      recommendation: latestRecommendation ? {
        strongBuy: latestRecommendation.strongBuy || 0,
        buy: latestRecommendation.buy || 0,
        hold: latestRecommendation.hold || 0,
        sell: latestRecommendation.sell || 0,
        strongSell: latestRecommendation.strongSell || 0,
        recommendationMean: result.recommendationMean,
        recommendationKey: calculatedRecommendationKey
      } : undefined
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
