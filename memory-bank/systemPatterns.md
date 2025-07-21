# Backend System Patterns

## Data Ingestion Workflow
The primary method for populating the database is a local, file-based parsing system. This was adopted after live scraping attempts were consistently blocked by Cloudflare.

1.  **Source Acquisition**: Manually save the HTML source of a Supreme Community item details page into the `diddyback/static/` directory.
2.  **Parsing**: Run the `pnpm ts-node prisma/parse-all-item-details.ts` script.
3.  **Processing**: The script iterates through all `.html` files in the `static/` directory. For each file, it uses `cheerio` to extract:
    *   Item details (description, retail price, release date).
    *   A list of all colorways.
    *   A gallery of all associated images.
4.  **Database Population**: The script connects to the NeonDB and performs the following operations in a transaction:
    *   Updates the core `Item` record with the new details.
    *   Creates a new `Variant` record for each colorway, with a unique slug.
    *   Deletes any existing images for the item and creates new `ItemImage` records for the full gallery.

This approach is manual but highly reliable and avoids the complexities of anti-bot evasion.

## Database Schema (PostgreSQL with Prisma)
The schema is designed to support detailed item tracking with variants and image galleries.

-   **`Item`**: The core model for a Supreme product. Contains metadata like title, slug, description, retail price, and release information.
-   **`Variant`**: Represents a specific version of an item, typically a colorway. Each variant has its own slug and is linked to a parent `Item`.
-   **`ItemImage`**: Stores URLs for an item's image gallery, with an index for ordering.
-   **`Price`**: (Future use) Intended to store historical price data for each variant from various platforms.

## REST API Surface
The API provides endpoints for retrieving item and variant data.

-   `GET /items`: Returns a paginated list of all items.
-   `GET /items/:id`: Returns a single item by its ID or slug, including all its associated `Variant` and `ItemImage` records.
-   `GET /items/:id/prices`: (Future use) Intended to return price history for an item.

## Deployment Pattern (Fly.io)
The backend is deployed on Fly.io, with the following conventions:
1.  **Secret Management**: `DATABASE_URL` is managed via Fly.io secrets and is only available at runtime.
2.  **Database Migrations**: Prisma migrations are run automatically at application startup by a `docker-entrypoint.sh` script. This ensures the database is always in sync with the schema before the application starts. 