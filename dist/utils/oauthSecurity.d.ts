import { Request } from 'express';
export declare function generateState(): string;
export declare function validateState(state: string): boolean;
export declare function requireAdmin(req: Request): boolean;
