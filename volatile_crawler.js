const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const GAINERS_URL = 'https://finance.yahoo.com/markets/stocks/gainers/';
const LOSERS_URL = 'https://finance.yahoo.com/markets/stocks/losers/';

async function fetchVolatileStocks(limit = 3) {
    console.log('[VolatileCrawler] Starting fetch for Gainers/Losers...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = {
        gainers: [],
        losers: []
    };

    try {
        // 1. Fetch Gainers
        results.gainers = await scrapeTable(browser, GAINERS_URL, limit, 'Gainers');

        // 2. Fetch Losers
        results.losers = await scrapeTable(browser, LOSERS_URL, limit, 'Losers');

        // 3. Fetch News for each
        const allStocks = [...results.gainers, ...results.losers];
        for (const stock of allStocks) {
            await fetchNewsForStock(browser, stock);
        }

    } catch (error) {
        console.error('[VolatileCrawler] Error:', error);
    } finally {
        await browser.close();
    }

    return results;
}

// Scrape the main table
async function scrapeTable(browser, url, limit, type) {
    console.log(`[VolatileCrawler] Fetching ${type} from ${url}...`);
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const stocks = [];
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for table
        await page.waitForSelector('table', { timeout: 10000 }).catch(() => { });

        const content = await page.content();
        const $ = cheerio.load(content);

        // Parse table rows
        let collectedCount = 0;
        $('table tbody tr').each((i, el) => {
            if (collectedCount >= limit) return false; // Break after limit reached

            const symbol = $(el).find('td').eq(0).text().trim();
            const name = $(el).find('td').eq(1).text().trim();
            const changeStr = $(el).find('td').eq(4).text().trim(); // e.g. "+35.63%"

            // Parse percentage
            // Remove % and +/-, convert to float
            const changeVal = parseFloat(changeStr.replace('%', '').replace('+', '').replace(',', ''));

            // Filter: Must be at least 30% fluctuation
            if (Math.abs(changeVal) < 30) {
                // If it's a "Top" list but value is small, ignore it.
                // Continue to next row
                return;
            }

            if (symbol) {
                stocks.push({
                    type,
                    symbol,
                    name,
                    change: changeStr,
                    news: null // to be filled
                });
                collectedCount++;
            }
        });

    } catch (e) {
        console.error(`[VolatileCrawler] Failed to scrape ${type}:`, e.message);
    } finally {
        await page.close();
    }
    return stocks;
}

// Fetch specific news for a stock ticker
async function fetchNewsForStock(browser, stock) {
    console.log(`[VolatileCrawler] Fetching news for ${stock.symbol} (${stock.change})...`);
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Quote news page
    const newsUrl = `https://finance.yahoo.com/quote/${stock.symbol}/news`;

    try {
        await page.goto(newsUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

        const content = await page.content();
        const $ = cheerio.load(content);

        // Find the most recent relevant article
        // Yahoo Quote News section structure
        let articleUrl = null;
        let articleTitle = null;

        $('h3').each((i, el) => {
            // Just take the first valid link
            const linkEl = $(el).closest('a').length ? $(el).closest('a') : $(el).find('a');
            const link = linkEl.attr('href');
            if (link && link.includes('/news/')) {
                articleUrl = link;
                articleTitle = $(el).text().trim();
                return false; // Break
            }
        });

        if (articleUrl) {
            if (!articleUrl.startsWith('http')) articleUrl = 'https://finance.yahoo.com' + articleUrl;

            stock.news = {
                title: articleTitle,
                link: articleUrl
            };

            // Go to article and scrape content
            console.log(`[VolatileCrawler] Reading article: ${articleTitle}`);
            await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

            const artContent = await page.content();
            const $art = cheerio.load(artContent);

            // Reusing robust extraction logic
            let bodyText = $('.caas-body').text().trim();
            if (!bodyText) bodyText = $('article').text().trim();
            if (!bodyText) bodyText = $('div.caas-content-wrapper').text().trim();
            if (!bodyText || bodyText.length < 100) {
                bodyText = $art('p').map((i, el) => $art(el).text()).get().join(' ');
            }

            stock.news.content = bodyText;
        } else {
            console.log(`[VolatileCrawler] No news found for ${stock.symbol}`);
        }

    } catch (e) {
        console.error(`[VolatileCrawler] Failed to fetch news for ${stock.symbol}:`, e.message);
    } finally {
        await page.close();
    }
}

module.exports = { fetchVolatileStocks };
