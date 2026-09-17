export declare class ChatService {
    private readonly logger;
    private groq;
    private cachedModel;
    constructor();
    private getValidModel;
    processChat(message: string, history: any[], file?: any): Promise<{
        reply: string;
    }>;
    processChatStream(message: string, history: any[], res: any): Promise<void>;
    analyzeData(file: any): Promise<{
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
