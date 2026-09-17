var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChatService_1;
import { Injectable, Logger } from '@nestjs/common';
import { Groq } from 'groq-sdk';
import * as process from 'process';
import Papa from 'papaparse';
let ChatService = ChatService_1 = class ChatService {
    logger = new Logger(ChatService_1.name);
    groq = null;
    cachedModel = null;
    constructor() {
        const apiKey = process.env.GROQ_API_KEY || 'mock-key';
        if (apiKey === 'mock-key') {
            this.logger.warn('GROQ_API_KEY is missing. Using mock responses.');
        }
        else {
            this.groq = new Groq({ apiKey });
        }
    }
    async getValidModel() {
        if (this.cachedModel)
            return this.cachedModel;
        const envModel = process.env.GROQ_MODEL;
        if (envModel) {
            this.cachedModel = envModel;
            return envModel;
        }
        if (!this.groq)
            return 'llama-3.1-8b-instant';
        try {
            const modelsResponse = await this.groq.models.list();
            const activeModels = modelsResponse.data;
            const isInvalidModel = (id) => {
                const lower = id.toLowerCase();
                const blocked = [
                    'whisper', 'guard', 'embed', 'roberta', 'vision',
                    'deepseek', 'orpheus', 'playai', 'distil-whisper',
                    'compound', 'tool-use'
                ];
                return blocked.some(term => lower.includes(term));
            };
            let model = activeModels.find((m) => m.id.toLowerCase().includes('llama') && !isInvalidModel(m.id));
            if (!model) {
                model = activeModels.find((m) => !isInvalidModel(m.id));
            }
            const selected = model ? model.id : 'llama-3.1-8b-instant';
            this.logger.log(`Selected Groq model: ${selected}`);
            this.cachedModel = selected;
            return selected;
        }
        catch (error) {
            this.logger.warn('Model discovery failed, using fallback');
            this.cachedModel = 'llama-3.1-8b-instant';
            return this.cachedModel;
        }
    }
    async processChat(message, history, file) {
        let contextMessage = message || '';
        if (file) {
            const csvContent = file.buffer.toString('utf-8');
            contextMessage += `\n\nI have uploaded a CSV file named ${file.originalname}. Here is the content:\n${csvContent.substring(0, 5000)}`;
            if (csvContent.length > 5000) {
                contextMessage += `\n[...truncated due to size]`;
            }
        }
        if (!this.groq) {
            return { reply: `(Mock Mode) You said: ${contextMessage}. Set GROQ_API_KEY to see real AI responses.` };
        }
        try {
            const modelToUse = await this.getValidModel();
            const messages = [
                { role: 'system', content: `You are an expert Indian Data Analyst AI. You have access to a local SQL engine (DuckDB) loaded with the user's dataset in a table named 'dataset'. If the user asks a question that requires exact data calculation, you MUST output a SQL query. Wrap SQL in \`\`\`sql ... \`\`\` blocks. Use exact column names from the context. Format responses using markdown, Indian numbering (Lakhs, Crores), and Rupees (₹).` },
                ...(history || []),
                { role: 'user', content: contextMessage }
            ];
            const completion = await this.groq.chat.completions.create({
                messages: messages,
                model: modelToUse,
            });
            return { reply: completion.choices[0]?.message?.content || 'No response from Groq.' };
        }
        catch (error) {
            this.logger.error('Groq API Error:', error);
            throw new Error('Failed to process chat with Groq');
        }
    }
    async processChatStream(message, history, res) {
        let contextMessage = message;
        if (!this.groq) {
            res.write(`data: ${JSON.stringify({ content: "(Mock Mode) Set GROQ_API_KEY for real AI responses." })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            res.end();
            return;
        }
        try {
            const modelToUse = await this.getValidModel();
            const messages = [
                { role: 'system', content: `You are an expert Indian Data Analyst AI. You have access to a local SQL engine (DuckDB) with the user's dataset in a table called 'dataset'.

When the user asks a data question:
1. Give a brief, direct natural-language answer first (1-2 sentences).
2. Then provide exactly ONE SQL query wrapped in \`\`\`sql ... \`\`\` blocks.

Rules:
- Use ONLY the exact column names from the schema provided in chat context.
- Do NOT invent column names. If the user says "sales" but the column is "revenue", use "revenue".
- Do NOT include thoughts, scratchpads, or multiple SQL blocks.
- Format non-SQL text using markdown, Indian numbering (Lakhs/Crores), and Rupees (₹).` },
                ...(history || []),
                { role: 'user', content: contextMessage }
            ];
            const stream = await this.groq.chat.completions.create({
                messages: messages,
                model: modelToUse,
                stream: true,
            });
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
            }
            res.write(`data: [DONE]\n\n`);
            res.end();
        }
        catch (error) {
            this.logger.error('Groq Stream Error:', error);
            if (this.cachedModel) {
                this.cachedModel = null;
                this.logger.log('Cleared model cache, will retry on next request');
            }
            const errMsg = error?.message || error?.toString() || "Unknown error";
            res.write(`data: ${JSON.stringify({ content: `\n\n**Error:** Failed to stream from Groq. Details: ${errMsg}` })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            res.end();
        }
    }
    async analyzeData(file) {
        if (!file)
            throw new Error('No file provided');
        const csvContent = file.buffer.toString('utf-8');
        const parsed = Papa.parse(csvContent, { header: true, dynamicTyping: true, skipEmptyLines: true });
        if (parsed.errors.length && parsed.data.length === 0) {
            throw new Error('Failed to parse CSV');
        }
        const data = parsed.data;
        const rowCount = data.length;
        const columns = parsed.meta.fields || [];
        let totalProfit = 0;
        let totalSales = 0;
        const numericColumns = {};
        const categoricalColumns = {};
        let dateColumn = null;
        columns.forEach(col => {
            const sampleVals = data.map(r => r[col]).filter(v => v !== null && v !== undefined);
            if (sampleVals.length === 0)
                return;
            const type = typeof sampleVals[0];
            if (type === 'number') {
                numericColumns[col] = { sum: 0, count: 0, max: -Infinity, min: Infinity, values: [] };
            }
            else if (type === 'string') {
                const isDateName = col.toLowerCase().includes('date') || col.toLowerCase().includes('time');
                const isDateVal = !isNaN(Date.parse(sampleVals[0]));
                if ((isDateName || isDateVal) && !dateColumn) {
                    dateColumn = col;
                }
                else {
                    categoricalColumns[col] = {};
                }
            }
        });
        data.forEach(row => {
            Object.keys(row).forEach(col => {
                const val = row[col];
                if (typeof val === 'number' && numericColumns[col]) {
                    numericColumns[col].sum += val;
                    numericColumns[col].count++;
                    numericColumns[col].values.push(val);
                    if (val > numericColumns[col].max)
                        numericColumns[col].max = val;
                    if (val < numericColumns[col].min)
                        numericColumns[col].min = val;
                    if (col.toLowerCase().includes('profit'))
                        totalProfit += val;
                    if (col.toLowerCase().includes('sales') || col.toLowerCase().includes('revenue'))
                        totalSales += val;
                }
                else if (typeof val === 'string' && categoricalColumns[col]) {
                    categoricalColumns[col][val] = (categoricalColumns[col][val] || 0) + 1;
                }
            });
        });
        let bestCategory = null;
        let bestCategoryData = [];
        for (const col of Object.keys(categoricalColumns)) {
            const uniqueCount = Object.keys(categoricalColumns[col]).length;
            if (uniqueCount > 1 && uniqueCount <= 10) {
                bestCategory = col;
                bestCategoryData = Object.entries(categoricalColumns[col]).map(([name, value]) => ({ name, value }));
                break;
            }
        }
        const trendData = [];
        if (dateColumn) {
            const dateGroups = {};
            data.forEach(row => {
                const d = row[dateColumn];
                if (!d)
                    return;
                const dStr = String(d).split('T')[0];
                if (!dateGroups[dStr])
                    dateGroups[dStr] = { date: dStr, count: 0, totalSales: 0 };
                dateGroups[dStr].count++;
                const salesCol = Object.keys(numericColumns).find(c => c.toLowerCase().includes('sales') || c.toLowerCase().includes('revenue'));
                if (salesCol && typeof row[salesCol] === 'number') {
                    dateGroups[dStr].totalSales += row[salesCol];
                }
            });
            const sortedDates = Object.keys(dateGroups).sort();
            sortedDates.slice(-20).forEach(d => trendData.push(dateGroups[d]));
        }
        const columnStats = Object.keys(numericColumns).map(col => {
            const stats = numericColumns[col];
            return {
                column: col,
                average: stats.count > 0 ? (stats.sum / stats.count).toFixed(2) : 0,
                max: stats.max !== -Infinity ? stats.max.toFixed(2) : 0,
                min: stats.min !== Infinity ? stats.min.toFixed(2) : 0
            };
        });
        let aiInsight = "Data processed successfully. No major anomalies detected in standard metrics.";
        if (this.groq) {
            try {
                const modelToUse = await this.getValidModel();
                const prompt = `Analyze this dataset summary and provide a 2-sentence business diagnostic insight. Total Rows: ${rowCount}, Total Sales: ${totalSales}. Categories: ${bestCategory ? JSON.stringify(bestCategoryData) : 'None'}. Make it professional and actionable. Use Indian formatting (₹, Lakhs/Crores). No markdown bolding.`;
                const completion = await this.groq.chat.completions.create({
                    messages: [{ role: 'system', content: 'You are an expert Indian data analyst.' }, { role: 'user', content: prompt }],
                    model: modelToUse,
                    temperature: 0.3
                });
                if (completion.choices[0]?.message?.content) {
                    aiInsight = completion.choices[0].message.content;
                }
            }
            catch (e) {
                this.logger.warn('AI Insight generation failed', e);
            }
        }
        return {
            rowCount,
            columns,
            totalProfit: totalProfit > 0 ? totalProfit.toFixed(2) : null,
            totalSales: totalSales > 0 ? totalSales.toFixed(2) : null,
            columnStats,
            rawSample: data.slice(0, 10),
            trendData,
            breakdown: { category: bestCategory, data: bestCategoryData },
            aiInsight,
            categoricalColumns: Object.keys(categoricalColumns)
        };
    }
};
ChatService = ChatService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], ChatService);
export { ChatService };
//# sourceMappingURL=chat.service.js.map