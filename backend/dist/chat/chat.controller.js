var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Post, Body, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service.js';
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async handleChat(body) {
        return this.chatService.processChat(body.message, body.history);
    }
    async handleStream(body, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        await this.chatService.processChatStream(body.message, body.history, res);
    }
    async handleUpload(file, body) {
        return this.chatService.processChat(body.message || '', [], file);
    }
    async handleAnalyze(file) {
        return this.chatService.analyzeData(file);
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "handleChat", null);
__decorate([
    Post('stream'),
    __param(0, Body()),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "handleStream", null);
__decorate([
    Post('upload'),
    UseInterceptors(FileInterceptor('file')),
    __param(0, UploadedFile()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "handleUpload", null);
__decorate([
    Post('analyze'),
    UseInterceptors(FileInterceptor('file')),
    __param(0, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "handleAnalyze", null);
ChatController = __decorate([
    Controller('chat'),
    __metadata("design:paramtypes", [ChatService])
], ChatController);
export { ChatController };
//# sourceMappingURL=chat.controller.js.map