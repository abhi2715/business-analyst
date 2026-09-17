import type { Response } from 'express';
import { ChatService } from './chat.service.js';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    handleChat(body: {
        message: string;
        history: any[];
    }): Promise<{
        reply: string;
    }>;
    handleStream(body: {
        message: string;
        history: any[];
    }, res: Response): Promise<void>;
    handleUpload(file: any, body: {
        message?: string;
    }): Promise<{
        reply: string;
    }>;
    handleAnalyze(file: any): Promise<{
        rowCount: number;
        columns: string[];
        totalProfit: string | null;
        totalSales: string | null;
        columnStats: {
            column: string;
            average: string | number;
            max: string | number;
            min: string | number;
        }[];
        rawSample: Record<string, any>[];
        trendData: any[];
        breakdown: {
            category: string | null;
            data: {
                name: string;
                value: number;
            }[];
        };
        aiInsight: string;
        categoricalColumns: string[];
    }>;
}
