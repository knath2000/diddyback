import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';
let getDroplist;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // @ts-ignore
    getDroplist = require('supcommunity-api').getDroplist;
}
catch {
    /* module missing or broken */
}
puppeteer.use(StealthPlugin());
const prisma = new PrismaClient();
async function fetchViaApi() {
    try {
        if (!getDroplist)
            return null;
        const apiRes = await getDroplist({
            season: 'spring-summer2025',
            date: '2025-07-03'
        });
        if (!apiRes?.length)
            return null;
        return apiRes.map((it) => ({
            title: it.name,
            imageUrl: it.image,
            season: 'spring-summer2025'
        }));
    }
    catch (e) {
        console.warn('supcommunity-api failed, will fallback to puppeteer', e);
        return null;
    }
}
async function fetchItems() {
    const isNonHeadless = process.argv.some((arg) => /--non-headless|--headless=false/i.test(arg));
    // 1) quick API attempt
    const apiItems = await fetchViaApi();
    if (apiItems && apiItems.length) {
        console.log('Fetched', apiItems.length, 'items via supcommunity-api');
        return apiItems;
    }
    const url = 'https://www.supremecommunity.com/season/spring-summer2025/droplist/2025-07-03/';
    console.log('Launching browser to scrape', url);
    const browser = await puppeteer.launch({ headless: !isNonHeadless, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
    // New: Handle the cookie consent banner first
    try {
        console.log('Waiting for cookie consent banner...');
        const acceptButtonSelector = '#cookiescript_accept';
        await page.waitForSelector(acceptButtonSelector, { visible: true, timeout: 15000 });
        console.log('Cookie banner found. Clicking "Accept all"...');
        await page.click(acceptButtonSelector);
        console.log('Clicked accept. Waiting for page to settle...');
        // Wait a moment for the content to load after dismissing the banner
        await new Promise(r => setTimeout(r, 5000));
    }
    catch (e) {
        console.warn('Cookie consent banner not found or could not be clicked. Continuing anyway...');
    }
    let contentSource = page;
    let html = '';
    try {
        console.log('Checking for content within an iframe...');
        const iframeHandle = await page.waitForSelector('iframe', { timeout: 10000 });
        if (iframeHandle) {
            const frame = await iframeHandle.contentFrame();
            if (frame) {
                console.log('Found an iframe, will scrape content from it.');
                contentSource = frame;
            }
        }
    }
    catch (e) {
        console.log('No iframe found, will scrape from the main page.');
    }
    console.log('Waiting for item titles to appear...');
    try {
        await contentSource.waitForSelector('.card-title, .name', { timeout: 60000 });
        console.log('Item titles found.');
    }
    catch (e) {
        console.warn('Timed out waiting for item titles. Capturing HTML anyway.', e);
    }
    console.log('Capturing final page HTML...');
    html = await contentSource.content();
    try {
        // Dynamically import fs/promises and write the debug file
        const fs = await import('fs/promises');
        await fs.writeFile('/tmp/droplist.html', html);
        console.log('Saved debug HTML to /tmp/droplist.html');
    }
    catch (e) {
        console.warn('Could not write debug HTML file.', e);
    }
    await browser.close();
    console.log('Parsing captured HTML with Cheerio...');
    const $ = cheerio.load(html);
    const items = [];
    // Use a selector that targets the container for each droplist item
    // Based on the site structure, each item card seems to be a 'div' inside the main grid.
    // We'll look for a common parent and then iterate. This selector may need tweaking.
    // A good candidate selector might be one that finds the item name and then goes up to a parent container.
    $('.card-title, .name').each((_i, el) => {
        const title = $(el).text().trim();
        if (!title)
            return;
        // Find the closest parent container that holds both the title and the image
        const itemContainer = $(el).closest('.masonry__item, .card, .product-tile, .item');
        let imageUrl = itemContainer.find('img').attr('src') || '';
        // The image might be lazy-loaded into a different element, so we add a fallback.
        if (!imageUrl) {
            const style = itemContainer.find('[style*="background-image"]').attr('style');
            if (style) {
                const match = style.match(/url\(['"]?(.*?)['"]?\)/);
                imageUrl = match ? match[1] : '';
            }
        }
        // Ensure relative URLs are made absolute
        if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = new URL(imageUrl, 'https://www.supremecommunity.com').href;
        }
        if (title && imageUrl) {
            items.push({
                title,
                imageUrl,
                season: 'spring-summer2025'
            });
        }
    });
    // Deduplicate items based on title
    const uniqueItems = Array.from(new Map(items.map(item => [item.title, item])).values());
    return uniqueItems;
}
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
}
async function upsertItems(items) {
    if (!items.length) {
        console.warn('No items found to upsert. Scraper might have failed.');
        return;
    }
    for (const item of items) {
        const slug = slugify(item.title);
        await prisma.item.upsert({
            where: { slug },
            update: {
                title: item.title,
                imageUrl: item.imageUrl,
                season: item.season,
                brand: 'Supreme'
            },
            create: {
                id: crypto.randomUUID(),
                title: item.title,
                slug,
                imageUrl: item.imageUrl,
                season: item.season,
                brand: 'Supreme',
                description: item.description ?? null
            }
        });
    }
}
async function main() {
    const items = await fetchItems();
    console.log('Scraped', items.length, 'unique items');
    await upsertItems(items);
    console.log('Database updated');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
