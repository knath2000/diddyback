import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: pnpm ts-node prisma/parse-item-details.ts <htmlFilePath>');
    process.exit(1);
  }

  const abs = path.resolve(process.cwd(), filePath);
  const html = await fs.readFile(abs, 'utf8');
  const $ = cheerio.load(html);

  // extract slug from og:url meta
  const ogUrl = $('meta[property="og:url"]').attr('content');
  if (!ogUrl) {
    console.error('❌ Could not find og:url meta tag');
    process.exit(1);
  }
  const slugMatch = ogUrl.match(/\/([^\/]+)\/?$/);
  const slug = slugMatch ? slugMatch[1] : null;
  if (!slug) {
    console.error('❌ Could not parse slug from URL');
    process.exit(1);
  }

  // description meta or product-caption
  let description = $('meta[name="description"]').attr('content')?.trim();
  if (!description) {
    description = $('.product-caption').text().trim();
  }

  // retail price
  const retailText = $('.product-options__title:contains("prices")')
    .parent()
    .find('.product-option')
    .first()
    .text()
    .replace(/[^0-9.]/g, '');
  const retailUsd = retailText ? parseFloat(retailText) : null;

  // release date + week
  const releaseBox = $('.product-inner__label .product-inner__box').first().text();
  const weekMatch = releaseBox.match(/Week\s+([0-9]+)/i);
  const dateMatch = releaseBox.match(/(\d{1,2}[a-z]{2}\s+\w+\s+\d{2})/i); // 3rd July 25
  let releaseWeek: string | null = null;
  let releaseDate: Date | null = null;
  if (weekMatch) releaseWeek = `Week ${weekMatch[1]}`;
  if (dateMatch) {
    const parsed = Date.parse(dateMatch[1].replace(/(\d{2})$/, '20$1')); // cheap convert 25->2025
    if (!isNaN(parsed)) releaseDate = new Date(parsed);
  }

  // colors list
  const colors: string[] = [];
  $('.product-options__title:contains("colors")')
    .parent()
    .find('.product-option')
    .each((_, el) => {
      const c = $(el).text().trim();
      if (c) colors.push(c);
    });

  // images gallery
  const images: string[] = [];
  $('.product-thumb__slider a').each((_, a) => {
    const url = $(a).attr('href');
    if (url) images.push(url);
  });

  if (!description) {
    console.warn('⚠️ No description found, skipping');
    return;
  }

  const prisma = new PrismaClient();
  try {
    const updated = await prisma.$transaction(async (tx) => {
      // @ts-ignore: fields added in latest schema
      const updateResult = await tx.item.updateMany({
        where: { slug },
        data: {
          description,
          // @ts-ignore
          retailUsd: retailUsd || undefined,
          // @ts-ignore
          releaseDate: releaseDate || undefined,
          // @ts-ignore
          releaseWeek: releaseWeek || undefined,
          // @ts-ignore
          colors,
        },
      });

      if (images.length) {
        // @ts-ignore image relation exists after generate
        await tx.itemImage.deleteMany({ where: { item: { slug } } });
        // create new
        await Promise.all(
          images.map((url, idx) =>
            // @ts-ignore
            tx.itemImage.create({ data: { url, idx, item: { connect: { slug } } } })
          )
        );
      }

      return updateResult;
    });

    if (updated.count === 0) {
      console.warn(`⚠️ No database rows were updated for slug ${slug}`);
    }
  } catch (e) {
    console.error('❌ Error updating item:', e);
    process.exit(1);
  }
}

main();