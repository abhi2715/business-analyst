import { Controller, Post, Body, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ChatService } from './chat.service.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async handleChat(@Body() body: { message: string, history: any[] }) {
    return this.chatService.processChat(body.message, body.history);
  }

  @Post('stream')
  async handleStream(@Body() body: { message: string, history: any[] }, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    await this.chatService.processChatStream(body.message, body.history, res);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async handleUpload(
    @UploadedFile() file: any,
    @Body() body: { message?: string }
  ) {
    return this.chatService.processChat(body.message || '', [], file);
  }

  @Post('analyze')
  @UseInterceptors(FileInterceptor('file'))
  async handleAnalyze(@UploadedFile() file: any) {
    return this.chatService.analyzeData(file);
  }
}
