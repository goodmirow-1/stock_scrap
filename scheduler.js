const cron = require('node-cron');
const { fetchNasdaqNews } = require('./yahoo_crawler');
const { fetchVolatileStocks } = require('./volatile_crawler');
const { summarizeArticles } = require('./summarizer');

console.log('[Scheduler] Service started. Waiting for 09:00 AM KST...');

// Schedule for 9:00 AM every day
cron.schedule('0 9 * * *', async () => {
    console.log(`[Scheduler] Running scheduled task at ${new Date().toLocaleString()}`);
    await runTask();
});

async function runTask() {
    try {
        // --- PART 1: General Market News ---
        console.log('1. Fetching General Market News...');
        const articles = await fetchNasdaqNews(5);

        console.log('2. Summarizing Market News...');
        const summaries = await summarizeArticles(articles);

        // --- PART 2: Volatile Stocks ---
        console.log('3. Fetching Volatile Stocks (Gainers/Losers)...');
        const volatileData = await fetchVolatileStocks(3); // Top 3 each

        // Flatten volatile news for summarization
        const volatileArticles = [];
        [...volatileData.gainers, ...volatileData.losers].forEach(stock => {
            if (stock.news && stock.news.content) {
                volatileArticles.push({
                    title: `[${stock.type}] ${stock.name} (${stock.symbol}): ${stock.change} - ${stock.news.title}`,
                    link: stock.news.link,
                    timeStr: 'Recent',
                    content: stock.news.content
                });
            }
        });

        console.log('4. Summarizing Volatile Stock News...');
        const volatileSummaries = await summarizeArticles(volatileArticles);

        // --- OUTPUT ---
        console.log('\n==========================================');
        console.log('       YAHOO FINANCE MARKET SUMMARY       ');
        console.log('==========================================');

        console.log('\n--- [GENERAL MARKET NEWS] ---');
        summaries.forEach((item, idx) => {
            console.log(`[${idx + 1}] ${item.title}`);
            console.log(`LINK: ${item.link}`);
            console.log(`SUMMARY (KO): ${item.summary}`);
            console.log('------------------------------------------');
        });

        console.log('\n--- [TOP MOVERS NEWS] ---');
        if (volatileSummaries.length === 0) {
            console.log("No news found for top movers.");
        } else {
            volatileSummaries.forEach((item, idx) => {
                console.log(`[${idx + 1}] ${item.title}`);
                console.log(`LINK: ${item.link}`);
                console.log(`SUMMARY (KO): ${item.summary}`);
                console.log('------------------------------------------');
            });
        }

        console.log('==========================================\n');

    } catch (error) {
        console.error('[Scheduler] Task failed:', error);
    }
}

// Allow manual run for testing
if (process.argv.includes('--test')) {
    console.log('[Scheduler] Manual test run triggered...');
    runTask();
}
