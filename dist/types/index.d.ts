export interface Item {
    id: string;
    title: string;
    slug: string;
    brand: string;
    imageUrl?: string;
    season?: string;
    styleCode?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    variants: Variant[];
}
export interface Variant {
    id: string;
    itemId: string;
    size: string;
    color: string;
    prices: Price[];
}
export interface Price {
    id: string;
    variantId: string;
    platform: 'STOCKX' | 'GOAT' | 'GRAILED';
    priceUsd: number;
    currency: string;
    askOrBid: 'ASK' | 'BID' | 'LAST';
    capturedAt: string;
}
export interface ApiResponse<T> {
    data: T;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
    };
}
