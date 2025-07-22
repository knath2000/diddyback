import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';
const STATIC_DIR = path.resolve(process.cwd(), 'static');
async function extractInfo(html) {
    const $ = cheerio.load(html);
    const ogUrl = $('meta[property="og:url"]').attr('content');
    if (!ogUrl)
        return null;
    const slugMatch = ogUrl.match(/\/([^\/]+)\/?$/);
    const slug = slugMatch ? slugMatch[1] : null;
    if (!slug)
        return null;
    let description = $('meta[name="description"]').attr('content')?.trim();
    if (!description)
        description = $('.product-caption').text().trim();
    if (!description)
        return null;
    const retailText = $('.product-options__title:contains("prices")')
        .parent()
        .find('.product-option')
        .first()
        .text()
        .replace(/[^0-9.]/g, '');
    const retailUsd = retailText ? parseFloat(retailText) : null;
    const releaseBox = $('.product-inner__label .product-inner__box').first().text();
    const weekMatch = releaseBox.match(/Week\s+([0-9]+)/i);
    const dateMatch = releaseBox.match(/(\d{1,2}[a-z]{2}\s+\w+\s+\d{2})/i);
    let releaseWeek = null;
    let releaseDate = null;
    if (weekMatch)
        releaseWeek = `Week ${weekMatch[1]}`;
    if (dateMatch) {
        const parsed = Date.parse(dateMatch[1].replace(/(\d{2})$/, '20$1'));
        if (!isNaN(parsed))
            releaseDate = new Date(parsed);
    }
    const colors = [];
    const colorsBox = $('.product-options__title')
        .filter((_, el) => $(el).text().trim().toLowerCase() === 'colors')
        .closest('.product-options');
    colorsBox.find('.product-option').each((_, el) => {
        const c = $(el).text().trim();
        if (c)
            colors.push(c);
    });
    const images = [];
    $('.product-thumb__slider a').each((_, a) => {
        const url = $(a).attr('href');
        if (url)
            images.push(`https://www.supremecommunity.com${url}`);
    });
    return {
        slug,
        description,
        retailUsd,
        releaseDate,
        releaseWeek,
        colors,
        images,
    };
}
async function main() {
    const entries = await fs.readdir(STATIC_DIR);
    const htmlFiles = entries.filter((f) => f.endsWith('.html'));
    if (htmlFiles.length === 0) {
        console.log('No HTML files found in static/.');
        return;
    }
    const prisma = new PrismaClient();
    let updatedItems = 0;
    let createdVariants = 0;
    for (const file of htmlFiles) {
        try {
            const html = await fs.readFile(path.join(STATIC_DIR, file), 'utf8');
            const info = await extractInfo(html);
            if (!info) {
                console.warn(`Skipping ${file} – could not extract info.`);
                continue;
            }
            await prisma.$transaction(async (tx) => {
                const item = await tx.item.findUnique({ where: { slug: info.slug } });
                if (!item) {
                    console.warn(`[${file}] ⚠️ Item with slug ${info.slug} not found. Run the catalog parser first.`);
                    return;
                }
                console.log(`[${file}] Updating item ${item.slug} (ID: ${item.id})`);
                console.log(`[${file}] Found ${info.colors.length} colors: ${info.colors.join(', ')}`);
                await tx.item.update({
                    where: { id: item.id },
                    data: {
                        description: info.description,
                        retailUsd: info.retailUsd,
                        releaseDate: info.releaseDate,
                        releaseWeek: info.releaseWeek,
                    },
                });
                // @ts-ignore
                await tx.itemImage.deleteMany({ where: { itemId: item.id } });
                // @ts-ignore
                await tx.itemImage.createMany({
                    data: info.images.map((url, idx) => ({ url, idx, itemId: item.id })),
                });
                for (const color of info.colors) {
                    const variantSlug = `${item.slug}-${color.toLowerCase().replace(/\s+/g, '-')}`;
                    console.log(`[${file}] Upserting variant with slug: ${variantSlug}`);
                    await tx.variant.upsert({
                        where: { slug: variantSlug },
                        update: { color },
                        create: {
                            slug: variantSlug,
                            color: color,
                            size: 'N/A', // Default size
                            itemId: item.id,
                        },
                    });
                    createdVariants++;
                }
                updatedItems++;
            });
            console.log(`[${file}] ✅ Processed item ${info.slug}`);
        }
        catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    }
    console.log(`\nFinished. 
  - Items updated: ${updatedItems}
  - Variants created/updated: ${createdVariants}`);
    await prisma.$disconnect();
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=parse-all-item-details.js.map