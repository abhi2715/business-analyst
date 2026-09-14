import { Injectable, Logger } from '@nestjs/common';
import { Groq } from 'groq-sdk';
import * as process from 'process';
import Papa from 'papaparse';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private groq: Groq | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY || 'mock-key';
    if (apiKey === 'mock-key') {
      this.logger.warn('GROQ_API_KEY is missing. Using mock responses.');
    } else {
      this.groq = new Groq({ apiKey });
    }
  }

  async processChat(message: string, history: any[], file?: any) {
    let contextMessage = message || '';

    if (file) {
      const csvContent = file.buffer.toString('utf-8');
      contextMessage += `\n\nI have uploaded a CSV file named ${file.originalname}. Here is the content:\n${csvContent.substring(0, 5000)}`;
      if (csvContent.length > 5000) {
        contextMessage += `\n[...truncated due to size]`;
      }
    }

    if (!this.groq) {
      // Mock response for testing if no API key is provided
      return { reply: `(Mock Mode) You said: ${contextMessage}. Set GROQ_API_KEY to see real Groq AI responses.` };
    }

    try {
      const messages = [
        { role: 'system', content: `You are an expert Indian Data Analyst AI. You have access to a local SQL engine (DuckDB) loaded with the user's dataset in a table named 'dataset'. If the user asks a question that requires exact data calculation (e.g., sum, averages, grouping), you MUST output a SQL query to answer it. Wrap your SQL precisely in \`\`\`sql ... \`\`\` blocks. The frontend will execute your SQL and display the results. Format other responses using markdown, Indian numbering (Lakhs, Crores), and Rupees (₹).` },
        ...(history || []),
        { role: 'user', content: contextMessage }
      ];

      const completion = await this.groq.chat.completions.create({
        messages: messages,
        model: 'llama3-8b-8192',
      });

      return { reply: completion.choices[0]?.message?.content || 'No response from Groq.' };
    } catch (error) {
      this.logger.error('Groq API Error:', error);
      throw new Error('Failed to process chat with Groq');
    }
  }

  async processChatStream(message: string, history: any[], res: any): Promise<void> {
    let contextMessage = message;

    if (!this.groq) {
      res.write(`data: ${JSON.stringify({ content: "(Mock Mode) You said: " + contextMessage + ". Set GROQ_API_KEY to see real Groq AI responses." })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    try {
      const messages = [
        { role: 'system', content: `You are an expert Indian Data Analyst AI. You have access to a local SQL engine (DuckDB) loaded with the user's dataset in a table named 'dataset'. If the user asks a question that requires exact data calculation, you MUST output a SQL query to answer it. Wrap your SQL precisely in \`\`\`sql ... \`\`\` blocks. IMPORTANT: When writing SQL, you MUST ONLY use the exact column names provided in the chat context. Do not invent column names (e.g., if the user asks for 'sales' but the column is 'revenue', use 'revenue'). Format non-SQL responses using markdown, Indian numbering (Lakhs, Crores), and Rupees (₹).` },
        ...(history || []),
        { role: 'user', content: contextMessage }
      ];

      let modelToUse = process.env.GROQ_MODEL;
      if (!modelToUse) {
        try {
          const modelsResponse = await this.groq.models.list();
          const activeModels = modelsResponse.data;
          
          const knownChatModels = [
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'llama-3.1-70b-versatile',
            'llama-3.2-3b-preview',
            'llama-3.2-1b-preview',
            'mixtral-8x7b-32768',
            'gemma2-9b-it'
          ];
          
          let preferredModel = activeModels.find((m: any) => knownChatModels.includes(m.id));
          
          if (!preferredModel) {
            preferredModel = activeModels.find((m: any) => {
              const id = m.id.toLowerCase();
              return !id.includes('whisper') && !id.includes('guard') && !id.includes('embed') && !id.includes('roberta');
            });
          }
          
          modelToUse = preferredModel ? preferredModel.id : activeModels[0].id;
          this.logger.log(`Dynamically selected Groq model: ${modelToUse}`);
        } catch (modelError) {
          modelToUse = 'llama-3.1-8b-instant';
        }
      }

      const stream = await this.groq.chat.completions.create({
        messages: messages as any,
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
    } catch (error: any) {
      this.logger.error('Groq Stream Error:', error);
      const errMsg = error?.message || error?.toString() || "Unknown error";
      res.write(`data: ${JSON.stringify({ content: `\n\n**Error:** Failed to stream from Groq. Details: ${errMsg}` })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }

  async analyzeData(file: any) {
    if (!file) throw new Error('No file provided');
    const csvContent = file.buffer.toString('utf-8');
    
    // Parse CSV
    const parsed = Papa.parse(csvContent, { header: true, dynamicTyping: true, skipEmptyLines: true });
    if (parsed.errors.length && parsed.data.length === 0) {
      throw new Error('Failed to parse CSV');
    }

    const data = parsed.data as Record<string, any>[];
    const rowCount = data.length;
    const columns = parsed.meta.fields || [];
    
    // 1. Basic Stats & Columns Type Inference
    let totalProfit = 0;
    let totalSales = 0;
    const numericColumns: Record<string, { sum: number, count: number, max: number, min: number, values: number[] }> = {};
    const categoricalColumns: Record<string, Record<string, number>> = {}; // col -> { val: count }
    let dateColumn: string | null = null;
    
    columns.forEach(col => {
      const sampleVals = data.map(r => r[col]).filter(v => v !== null && v !== undefined);
      if (sampleVals.length === 0) return;
      
      const type = typeof sampleVals[0];
      if (type === 'number') {
        numericColumns[col] = { sum: 0, count: 0, max: -Infinity, min: Infinity, values: [] };
      } else if (type === 'string') {
        // Detect Date
        const isDateName = col.toLowerCase().includes('date') || col.toLowerCase().includes('time');
        const isDateVal = !isNaN(Date.parse(sampleVals[0]));
        if ((isDateName || isDateVal) && !dateColumn) {
          dateColumn = col;
        } else {
          // Track categorical
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
          if (val > numericColumns[col].max) numericColumns[col].max = val;
          if (val < numericColumns[col].min) numericColumns[col].min = val;
          
          if (col.toLowerCase().includes('profit')) totalProfit += val;
          if (col.toLowerCase().includes('sales') || col.toLowerCase().includes('revenue')) totalSales += val;
        } else if (typeof val === 'string' && categoricalColumns[col]) {
          categoricalColumns[col][val] = (categoricalColumns[col][val] || 0) + 1;
        }
      });
    });

    // Determine Best Category for Breakdown
    let bestCategory = null;
    let bestCategoryData: {name: string, value: number}[] = [];
    for (const col of Object.keys(categoricalColumns)) {
      const uniqueCount = Object.keys(categoricalColumns[col]).length;
      if (uniqueCount > 1 && uniqueCount <= 10) {
        bestCategory = col;
        bestCategoryData = Object.entries(categoricalColumns[col]).map(([name, value]) => ({ name, value }));
        break;
      }
    }

    // 2. Trend Analysis (Time Series)
    const trendData: any[] = [];
    if (dateColumn) {
      // Group by date
      const dateGroups: Record<string, any> = {};
      data.forEach(row => {
        const d = row[dateColumn as string];
        if (!d) return;
        const dStr = String(d).split('T')[0]; // Simple grouping
        if (!dateGroups[dStr]) dateGroups[dStr] = { date: dStr, count: 0, totalSales: 0 };
        dateGroups[dStr].count++;
        // If there's a sales column, add it
        const salesCol = Object.keys(numericColumns).find(c => c.toLowerCase().includes('sales') || c.toLowerCase().includes('revenue'));
        if (salesCol && typeof row[salesCol] === 'number') {
          dateGroups[dStr].totalSales += row[salesCol];
        }
      });
      // Take top 20 dates
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

    // 3. AI Insights (Diagnostic)
    let aiInsight = "Data processed successfully. No major anomalies detected in standard metrics.";
    if (this.groq) {
      try {
        const prompt = `Analyze this dataset summary and provide a 2-sentence business diagnostic insight (e.g. "Revenue is strong, but X region is underperforming"). Total Rows: ${rowCount}, Total Sales: ${totalSales}. Categories: ${bestCategory ? JSON.stringify(bestCategoryData) : 'None'}. Make it sound professional and actionable. Do not use markdown bolding. Use Indian formatting (₹, Lakhs/Crores) for any numbers.`;
        const completion = await this.groq.chat.completions.create({
          messages: [{ role: 'system', content: 'You are an expert Indian data analyst.' }, { role: 'user', content: prompt }],
          model: 'llama3-8b-8192',
          temperature: 0.3
        });
        if (completion.choices[0]?.message?.content) {
          aiInsight = completion.choices[0].message.content;
        }
      } catch (e) {
        this.logger.warn('Groq Insight failed', e);
      }
    }

    return {
      rowCount,
      columns,
      totalProfit: totalProfit > 0 ? totalProfit.toFixed(2) : null,
      totalSales: totalSales > 0 ? totalSales.toFixed(2) : null,
      columnStats,
      rawSample: data.slice(0, 10),
      // New God-Mode metrics
      trendData,
      breakdown: { category: bestCategory, data: bestCategoryData },
      aiInsight,
      categoricalColumns: Object.keys(categoricalColumns) // For global filters
    };
  }
}
