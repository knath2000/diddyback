import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

// ---------------------------
// Types
// ---------------------------
interface ParsedItem {
  title: string;
  slug: string;
  season?: string;
  imageUrl?: string;
}

// ---------------------------
// Helpers
// ---------------------------
function absoluteImage(relative: string): string {
  if (!relative) return relative;
  if (relative.startsWith('http')) return relative;
  return `https://www.supremecommunity.com${relative}`;
}

function extractSeason(slug: string): string | undefined {
  // slug pattern: spring-summer2025-supreme-skull-bell-keychain
  const parts = slug.split('-');
  if (parts.length < 2) return undefined;
  return `${parts[0]}-${parts[1]}`; // spring-summer2025
}

// ---------------------------
// Main
// ---------------------------
async function main() {
  const filePath = process.argv[2] || 'static/droplist.html';
  const absPath = path.resolve(process.cwd(), filePath);
  console.log(`📄 Loading HTML from ${absPath}`);

  const html = await fs.readFile(absPath, 'utf8');
  const $ = cheerio.load(html);

  const items: ParsedItem[] = [];

  $('.catalog-item').each((_idx, el) => {
    const $el = $(el);
    const title = $el.attr('data-name')?.trim();
    const slug = $el.find('a.catalog-item-top').attr('data-itemslug')?.trim();
    if (!title || !slug) return;
    const imgRel = $el.find('img').attr('src') || '';
    items.push({
      title,
      slug,
      season: extractSeason(slug),
      imageUrl: absoluteImage(imgRel),
    });
  });

  if (!items.length) {
    console.error('❌ No items parsed! Exiting.');
    process.exit(1);
  }

  console.log(`✅ Parsed ${items.length} items. Upserting into database...`);

  const prisma = new PrismaClient();
  try {
    for (const item of items) {
      await prisma.item.upsert({
        where: { slug: item.slug },
        create: {
          title: item.title,
          slug: item.slug,
          imageUrl: item.imageUrl,
          season: item.season,
        },
        update: {
          title: item.title,
          imageUrl: item.imageUrl,
          season: item.season,
          updatedAt: new Date(),
        },
      });
    }
    console.log(`🚀 Finished upserting ${items.length} items.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 