export declare function getTokenExpiry(): number;
export declare function getAccessToken(): Promise<string>;
export declare function fetchWithAuth(url: string, opts?: Partial<RequestInit>): Promise<Response>;
