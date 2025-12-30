const puppeteer = require('puppeteer');

async function translateText(text, targetLang = 'ko') {
    if (!text) return "";

    // Truncate excessively long text (Google Translate m-site limit is around ~2000-5000 chars, keep it safe)
    const safeText = text.substring(0, 1500);

    const url = `https://translate.google.com/m?sl=auto&tl=${targetLang}&q=${encodeURIComponent(safeText)}`;

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36');

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

        // Mobile version usually keeps result in .result-container
        const result = await page.evaluate(() => {
            const el = document.querySelector('.result-container');
            return el ? el.innerText : null;
        });

        return result || text; // Fallback to original text if failed

    } catch (err) {
        console.error('[Translator] Translation failed:', err.message);
        return text;
    } finally {
        await browser.close();
    }
}

module.exports = { translateText };
