import { prisma } from '../src/utils/prisma';
import { fetchWithAuth } from '../src/utils/stockxAuth';

async function main() {
  const items = await prisma.item.findMany({
    include: {
      variants: {
        where: {
          stockxProductId: null // Only process variants that are missing the ID
        }
      }
    },
    where: {
      variants: {
        some: {
          stockxProductId: null
        }
      }
    }
  });

  if (items.length === 0) {
    console.log("All variants already have a StockX Product ID. Nothing to do.");
    return;
  }

  console.log(`Found ${items.length} items with variants needing a StockX ID.`);

  for (const item of items) {
    console.log(`\nProcessing: ${item.title}`);

    // 1. Search StockX API for the product
    const searchUrl = `https://api.stockx.com/v2/search?query=${encodeURIComponent(item.title)}`;
    const searchRes = await fetchWithAuth(searchUrl);

    if (!searchRes.ok) {
      console.error(`  - StockX search failed: ${searchRes.status}`);
      continue;
    }

    const searchData = await searchRes.json() as any;
    const products = searchData?.Products;

    if (!products || products.length === 0) {
      console.log(`  - No results found on StockX.`);
      continue;
    }

    const stockxProduct = products[0];
    console.log(`  - Found StockX product: ${stockxProduct.title} [${stockxProduct.objectID}]`);

    // 2. Fetch detailed product info to get variants
    const productDetailUrl = `https://api.stockx.com/v2/products/${stockxProduct.objectID}?includes=market,children`;
    const productDetailRes = await fetchWithAuth(productDetailUrl);

    if (!productDetailRes.ok) {
        console.error(`  - Failed to fetch product details: ${productDetailRes.status}`);
        continue;
    }

    const productDetailData = await productDetailRes.json() as any;
    const stockxChildren = productDetailData?.Product?.children;

    if (!stockxChildren) {
        console.log(`  - No variants (children) found on StockX. Skipping.`);
        continue;
    }

    // 3. Match our DB variants to StockX variants and update
    for (const dbVariant of item.variants) {
      // Find the StockX variant that matches our DB variant's size.
      // StockX traits can be "Size", "Shoe Size", etc. We'll check for a 'size' trait.
      const matchingStockxVariant = Object.values(stockxChildren).find((sv: any) => {
          return sv.market?.productUuid && sv.traits?.some((t: any) => t.name === 'Size' && t.value === dbVariant.size);
      });

      if (matchingStockxVariant) {
        const sxId = (matchingStockxVariant as any).id;
        console.log(`    - Matched DB size "${dbVariant.size}" -> StockX ID [${sxId}]`);
        await prisma.variant.update({
          where: { id: dbVariant.id },
          data: { stockxProductId: sxId },
        });
      } else {
        console.log(`    - No StockX match for DB size: "${dbVariant.size}"`);
      }
    }
    console.log("  - Waiting 1 second before next item to avoid rate limits...");
    await new Promise(r => setTimeout(r, 1000)); 
  }

  console.log("\nBackfill complete.");
}

main()
  .catch((e) => {
    console.error("An error occurred during the backfill process:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 