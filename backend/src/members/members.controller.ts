import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MembersService } from './members.service.js';

interface UploadedWorkbook {
  buffer: Buffer;
  originalname: string;
}

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  importMasterlist(@UploadedFile() file?: UploadedWorkbook) {
    return this.membersService.importMasterlist(file);
  }

  @Post()
  createMember(@Body() body: Record<string, unknown>) {
    return this.membersService.createMember(body);
  }

  @Patch(':id')
  updateMember(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return this.membersService.updateMember(id, body);
  }

  @Get('lookup')
  lookupMember(@Query('block') block?: string, @Query('lot') lot?: string) {
    return this.membersService.lookupMember(block, lot);
  }

  @Get()
  listMembers(@Query('page') page?: string, @Query('search') search?: string) {
    return this.membersService.listMembers(page, search);
  }
}
