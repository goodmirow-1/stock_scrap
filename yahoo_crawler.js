const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

// Target URL for Nasdaq Composite (^IXIC) News
const TARGET_URL = 'https://finance.yahoo.com/quote/%5EIXIC/news?p=%5EIXIC';

async function fetchNasdaqNews(limit = 5) {
    console.log(`[Crawler] Starting fetch from ${TARGET_URL}...`);
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set a realistic User-Agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait for the news stream to load
        // Yahoo Finance usually has a stream list. Selector needs to be generic enough.
        // Common structure: #Fin-Stream ul li
        await page.waitForSelector('#Fin-Stream ul li', { timeout: 15000 }).catch(() => console.log("Stream selector timed out, trying to parse anyway."));

        const content = await page.content();
        const $ = cheerio.load(content);

        let articles = [];

        // Parse list items - Generic Fallback
        // Common pattern: h3 contains title, wrapped or followed by link.
        $('h3').each((i, el) => {
            const title = $(el).text().trim();
            const linkEl = $(el).closest('a').length ? $(el).closest('a') : $(el).find('a');
            let link = linkEl.attr('href');

            // Try sibling if not nested
            if (!link) {
                // sometimes h3 is separate from the link wrapper, but in YF, h3 is usually inside <a> or contains <a>
                // Let's try to find the nearest 'a' up the tree if not inside
                const parentLink = $(el).closest('a');
                if (parentLink.length) link = parentLink.attr('href');
            }

            // Heuristic for time: Look for nearby 'span' with text like "ago"
            // This is brittle, so maybe just extraction time is enough
            let timeStr = "Recent";
            try {
                // Try to find a timestamp relative to h3
                const container = $(el).closest('li') || $(el).closest('div');
                const timeSpan = container.find('span:contains("ago")').first();
                if (timeSpan.length) timeStr = timeSpan.text().trim();
            } catch (e) { }

            if (title && link) {
                // Fix relative links
                if (!link.startsWith('http')) {
                    link = 'https://finance.yahoo.com' + link;
                }

                // Filter out ads or irrelevant links if needed (check proper URL structure)
                // Filter duplicates
                if (link.includes('/news/') && !articles.some(a => a.link === link)) {
                    articles.push({
                        title,
                        link,
                        timeStr
                    });
                }
            }
        });

        // Limit to requested number before detailed scraping to save time
        articles = articles.slice(0, limit);
        console.log(`[Crawler] Found ${articles.length} initial articles. Fetching details...`);

        // Fetch details for each article
        for (let i = 0; i < articles.length; i++) {
            try {
                const article = articles[i];
                console.log(`[Crawler] Fetching content for: ${article.title}`);

                const articlePage = await browser.newPage();
                await articlePage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                await articlePage.goto(article.link, { waitUntil: 'domcontentloaded', timeout: 30000 });

                const articleHtml = await articlePage.content();
                const $art = cheerio.load(articleHtml);

                // Yahoo news content is usually in .caas-body
                // Fallback to all 'p' tags if specific classes fail
                let bodyText = $('.caas-body').text().trim();
                if (!bodyText) bodyText = $('article').text().trim();
                if (!bodyText) bodyText = $('div.caas-content-wrapper').text().trim();
                // Last resort: grab all paragraphs
                if (!bodyText || bodyText.length < 100) {
                    bodyText = $art('p').map((i, el) => $art(el).text()).get().join(' ');
                }

                console.log(`[Crawler] Content length for "${article.title}": ${bodyText.length}`);

                article.content = bodyText;

                await articlePage.close();

                // Be nice to the server
                await new Promise(r => setTimeout(r, 1000));
            } catch (err) {
                console.error(`[Crawler] Failed to fetch content for ${articles[i].title}: ${err.message}`);
                articles[i].content = "Failed to fetch content.";
            }
        }

        return articles;

    } catch (error) {
        console.error('[Crawler] Error fetching news:', error);
        return [];
    } finally {
        await browser.close();
    }
}

module.exports = { fetchNasdaqNews };
