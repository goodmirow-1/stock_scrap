const { translateText } = require('./translator');

async function summarizeArticles(articles) {
    const summarized = [];

    for (const article of articles) {
        let summary = "";

        // MODE 1: Heuristic (First 3 sentences) - DEFAULT
        // Simple sentence splitting by period, looking for valid length
        const sentences = article.content
            .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
            .split("|")
            .map(s => s.trim())
            .filter(s => s.length > 20); // Filter out short noise

        summary = sentences.slice(0, 3).join(' ') + (sentences.length > 3 ? "..." : "");

        /* 
        // MODE 2: OpenAI (Uncomment to use if API Key is available)
        if (process.env.OPENAI_API_KEY) {
           // ... (Same as before)
        }
        */

        // Translate the summary to Korean
        console.log(`[Summarizer] Translating summary for: ${article.title}`);
        const koreanSummary = await translateText(summary, 'ko');

        summarized.push({
            title: article.title,
            link: article.link,
            originalTime: article.timeStr,
            summary: koreanSummary // Use translated text
        });
    }

    return summarized;
}

module.exports = { summarizeArticles };
