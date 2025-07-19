import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log(`Reading items from seed-data.json...`);

  const dataPath = path.join(__dirname, 'seed-data.json');
  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  const seedItems = JSON.parse(fileContent);

  console.log(`Seeding ${seedItems.length} items from local data...`);

  for (const item of seedItems) {
    const slug = item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await prisma.item.upsert({
      where: { slug: slug },
      update: {
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
      },
      create: {
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        slug: slug,
      },
    });
  }

  console.log('Database seeded successfully from local JSON file.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  }); 