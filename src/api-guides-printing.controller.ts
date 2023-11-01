import { Body, Controller, Get, Post, Req, Res, UseInterceptors } from '@nestjs/common';
import { ApiGuidesPrintingService } from './api-guides-printing.service';
import { HttpStatusCode } from 'axios';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { FiltersDto } from './dto/filters.dto';

@Controller('api-guides-printing')
export class ApiGuidesPrintingController {
  constructor(private readonly apiGuidesPrintingService: ApiGuidesPrintingService) {}

  @Get('hello')
  getHello(): string {
    return this.apiGuidesPrintingService.getHello();
  }

  @UseInterceptors(TokenInterceptor)
  @Post('printing')
  async guidesPrinting(
    @Res() res,
    @Body() body: FiltersDto,
    @Req() request,
  ) {
    const client = request.client;
    const response = await this.apiGuidesPrintingService.guidesPrinting(
      client,
      body
    );

    return res.status(HttpStatusCode.Ok).json(response);
  }

  @UseInterceptors()
  @Get('download-pdf')
  async downloadPdf(
    @Req() request,
    @Res() res,
  ) {
    const response = await this.apiGuidesPrintingService.downloadPdf(request.query);

    return res.status(HttpStatusCode.Ok).json(response);
  }
}
