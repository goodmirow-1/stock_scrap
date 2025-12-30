const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class NaverSearch {
    constructor() {
        this.proxyHost = "v2.proxyempire.io";
        this.proxyPort = "5000";
        this.proxyList = [
            { username: "r_89a92c4db7-country-kr-region-busan-sid-15a70c1k", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-busan-sid-806b5h56", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-chungcheongnam-do-sid-h8kg848h", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-chungcheongnam-do-sid-268jaf80", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-daegu-sid-0a26gk1a", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-daegu-sid-99gdi26f", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-daejeon-sid-ha77bggg", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-daejeon-sid-jae006jj", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-gangwon-do-sid-7ddf80kk", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-gangwon-do-sid-ae4e2iik", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-gwangju-sid-k2d6c2b9", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-gwangju-sid-220cffe8", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-gyeonggi-do-sid-i8ke8j35", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-gyeonggi-do-sid-8cak5877", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-gyeongsangbuk-do-sid-ehgff3fi", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-gyeongsangbuk-do-sid-a9g2b1d0", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-gyeongsangnam-do-sid-bbfbiaef", password: "7163f96086" },
            { username: "r_89a92c4db7-country-kr-region-gyeongsangnam-do-sid-f00594j1", password: "7163f96086" }
        ];
    }

    getRandomUserAgent() {
        const platforms = [
            'Windows NT 10.0', 'Windows NT 6.1',
            'Macintosh; Intel Mac OS X 10_15', 'Macintosh; Intel Mac OS X 10_14',
            'iPhone; CPU iPhone OS 13_2_3 like Mac OS X',
            'iPad; CPU OS 13_2_3 like Mac OS X',
            'Android 10', 'Android 11'
        ];

        const browsers = [
            { name: 'Chrome', minVersion: 80, maxVersion: 91 },
            { name: 'Safari', minVersion: 13, maxVersion: 14 },
            { name: 'Firefox', minVersion: 75, maxVersion: 89 },
            { name: 'Edge', minVersion: 80, maxVersion: 91 }
        ];

        const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const browser = browsers[Math.floor(Math.random() * browsers.length)];
        const version = getRandomInt(browser.minVersion, browser.maxVersion);

        let userAgent = `Mozilla/5.0 (${platform})`;
        
        if (platform.includes('Windows')) {
            userAgent += ' AppleWebKit/537.36 (KHTML, like Gecko)';
        }

        switch (browser.name) {
            case 'Chrome':
                userAgent += ` Chrome/${version}.0.${getRandomInt(1000, 9999)}.${getRandomInt(0, 999)} Safari/537.36`;
                break;
            case 'Safari':
                if (platform.includes('iPhone') || platform.includes('iPad')) {
                    userAgent += ` AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Mobile/15E148 Safari/604.1`;
                } else {
                    userAgent += ` AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Safari/605.1.15`;
                }
                break;
            case 'Firefox':
                userAgent += ` Gecko/20100101 Firefox/${version}.0`;
                break;
            case 'Edge':
                userAgent += ` AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.${getRandomInt(1000, 9999)}.${getRandomInt(0, 999)} Safari/537.36 Edg/${version}.0.${getRandomInt(100, 999)}.${getRandomInt(0, 99)}`;
                break;
        }

        return userAgent;
    }

    getRandomProxy() {
        return this.proxyList[Math.floor(Math.random() * this.proxyList.length)];
    }

    getCurlCommand(query, proxy, userAgent) {
        const encodedQuery = encodeURIComponent(query);
        const proxyUrl = `${this.proxyHost}:${this.proxyPort}`;
        
        const curlCommand = `curl -k -s -w "%{http_code}" -o - ` +
            `--proxy ${proxyUrl} ` +
            `--proxy-user ${proxy.username}:${proxy.password} ` +
            `"https://m.search.naver.com/search.naver?where=m&sm=mtp_hty.top&query=${encodedQuery}" ` +
            `-H "accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7" ` +
            `-H "accept-language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7" ` +
            `-H "priority: u=0, i" ` +
            `-H "referer: https://m.naver.com/" ` +
            `-H "sec-ch-ua: \\"Google Chrome\\";v=\\"131\\", \\"Chromium\\";v=\\"131\\", \\"Not_A Brand\\";v=\\"24\\"" ` +
            `-H "sec-ch-ua-mobile: ?0" ` +
            `-H "sec-ch-ua-platform: \\"macOS\\"" ` +
            `-H "sec-fetch-dest: document" ` +
            `-H "sec-fetch-mode: navigate" ` +
            `-H "sec-fetch-site: none" ` +
            `-H "sec-fetch-user: ?1" ` +
            `-H "upgrade-insecure-requests: 1" ` +
            `-H "user-agent: ${userAgent}"`;

        return curlCommand;
    }

    async executeCurl(command) {
        try {
            const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
            const status = stdout.slice(-3).match(/\d{3}/) ? parseInt(stdout.slice(-3)) : 403;
            const html = status === 200 ? stdout.slice(0, -3) : '';
            return { html, status };
        } catch (error) {
            console.error(`Subprocess error: ${error.message}`);
            return { html: '', status: 403 };
        }
    }

    async getNaverMobileSearchHtml(query) {
        console.log(`Calling getNaverMobileSearchHtml(${query})`);
        const delayMs = 1100;
        const maxRetries = 1;

        for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
            try {
                console.log(`Attempting search for ${query} [Attempt ${retryCount + 1}/${maxRetries}]`);
                
                // Sleep function
                await new Promise(resolve => setTimeout(resolve, delayMs * (retryCount + 1)));

                const userAgent = this.getRandomUserAgent();
                const proxy = this.getRandomProxy();
                const curlCommand = this.getCurlCommand(query, proxy, userAgent);
                const { html, status } = await this.executeCurl(curlCommand);

                if (status === 200) {
                    return { html, status };
                }
            } catch (error) {
                console.error(`Error during attempt ${retryCount + 1}/${maxRetries} for ${query}: ${error.message}`);
            }
        }

        return { html: '', status: 403 };
    }
}

async function main() {
    const search = new NaverSearch();
    const queries = [
        "포뉴 코엔자임Q10 700mg x 60캡슐 fs 5MF 카제로템",
        "유유제약 GEM 파로효소 발효 곡물 효소 100만 역가 수치 카제로템 90g, 4개",
        "포뉴 L 아르기닌 6000 마카 1000 20ml x 15포, 4개",
        "포뉴 NC 100억 유산균 패밀리 프로바이오틱스 카제로템 임산부 온 가족 30포, 2개",
        "포뉴 아르기닌 6000 20mlx15포 fs HCS",
        "포뉴 아르기닌6000",
        "아르기닌6000",
        "포뉴 아르기닌 마카",
        "L 아르기닌",
        "포뉴 L 아르기닌",
        "포뉴 멀티비타민미네랄 600mg x 180정 x 2박스 oc",
        "포뉴 A100 종합비타민 멀티비타민 카제로템 임산부 천연 합성 선택은 180정, 2개"
    ];

    for (const query of queries) {
        console.log(`\nProcessing query: ${query}`);
        const result = await search.getNaverMobileSearchHtml(query);
        console.log(`Status: ${result.status}`);
        
        if (result.status === 200) {
            console.log(`HTML Content (first 500 chars): ${result.html.substring(0, 500)}...`);
        } else {
            console.log("Failed to retrieve search results");
        }
    }
}

// Export the class for use in other modules
module.exports = NaverSearch;

// Run main function if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}