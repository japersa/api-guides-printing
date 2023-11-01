import { Injectable, Logger } from '@nestjs/common';
import { FiltersDto } from './dto/filters.dto';
import { ShipmentsService } from './services/shipments.service';
import { DateFunctions } from './common/utils/date-functions';
import BarcodeWriter from 'bwip-js';
import crypto from 'crypto';
import fs from 'promise-fs';
import ejs from 'ejs';
import { S3Service } from './services/s3.service';
import { HttpStatusCode } from 'axios';
import * as chromium from 'chrome-aws-lambda';

@Injectable()
export class ApiGuidesPrintingService {
  private logger = new Logger(ApiGuidesPrintingService.name);

  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly s3Service: S3Service,
  ) { }

  getHello(): string {
    return 'Hello World!';
  }

  async guidesPrinting(client, filters: FiltersDto) {
    let filename;
    let base64 = '';
    let response;
    try {
      const guides = await this._getGuides(filters, client);

      if (guides.length > 0) {
        for (let i = 0; i < guides.length; i++) {
          const guide = guides[i];
          const barcodeBase64 = await this._generateBarcode(guide.id);
          guides[i].barcode = barcodeBase64;
        }

        if (filters.useBaseEncode === undefined || filters.useBaseEncode) {
          const file = await this._generateAndReturnPdf(guides);
          base64 = file.base64;
          filename = file.filename;
        } else {
          const guideBlocks = [];
          for (let index = 0; index < guides.length; index += 100) {
            const block = guides.slice(index, index + 100);
            guideBlocks.push(block);
          }
          const filenames = [];
          for (const block of guideBlocks) {
            const file = await this._generateAndReturnPdf(block);
            //await this.s3Service.putFile(file.filename, file.pdf);
            filenames.push(file.filename);
          }

          filename = filenames;
        }

        response = {
          statusCode: HttpStatusCode.Ok,
          statusText: 'Created',
          message: 'PDF creado correctamente.',
          filename,
          base64,
        };
      } else {
        response = {
          statusCode: HttpStatusCode.Ok,
          statusText: 'Conflict',
          message:
            'No se encontró ningún registro asociado al filtro ingresado.',
        };
      }
    } catch (error) {
      this.logger.error(error);
      response = {
        statusCode: HttpStatusCode.Conflict,
        statusText: 'Conflict',
        message:
          'No es posible procesar la petición, comuniquese con el area de soporte.',
      };
      console.log(error);
    }

    return response;
  }

  private async _getGuides(filters, client) {
    let guides;
    if (filters.guias !== undefined && filters.guias.length > 0) {
      guides = await this.shipmentsService._getGuidesByIds(
        filters.guias,
        client,
      );
    } else {
      const initialDate = DateFunctions.getDateShort(filters.fechaInicial);
      const finalDate = DateFunctions.getDateShort(filters.fechaFinal);

      guides = await this.shipmentsService._getGuidesByDates(
        initialDate,
        finalDate,
        client,
      );
    }

    console.log(guides);
    return guides.Items;
  }

  private async _generateBarcode(guide) {
    const barcode = await BarcodeWriter.toBuffer({
      bcid: 'code128', // Barcode type
      text: `${guide}`, // Text to encode
      scale: 3, // 3x scaling factor
      height: 10, // Bar height, in millimeters
      includetext: true, // Show human-readable text
      textxalign: 'center', // Always good to set this
      textsize: 7,
    });

    return barcode.toString('base64');
  }

  private async _generateFileName() {
    const randomString = crypto.randomBytes(16).toString('hex'); // Genera una cadena aleatoria
    const timestamp = new Date().getTime(); // Agrega una marca de tiempo para hacer el nombre único
    return `${randomString}_${timestamp}`;
  }

  private async _generateAndReturnPdf(guides) {
    let base64;
    const filename = await this._generateFileName();
    const htmlRendered = await this._renderTemplatePDF(guides);
    const object = await this.s3Service.putFile(filename, htmlRendered, 'pdf', true);
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(
      `https://orion-services-bucket.s3.eu-west-1.amazonaws.com/${filename}`,
      {
        waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
      },
    );


    try {
      const pdf = await page.pdf({
        format: 'a4',
        timeout: 1000 * 60 * 60,
      });

      const _base64 = await pdf;
      base64 = _base64.toString('base64');
    } catch (error) {
      console.log(error);
    } finally {
      await browser.close();
    }

    return { filename, base64 };
  }

  private async _renderTemplatePDF(guides) {
    const bitmap_dest = await fs.readFile(
      `${process.env['PATH_IMGS']}destinatario.png`,
    );
    const bitmap_ent = await fs.readFile(
      `${process.env['PATH_IMGS']}entrega.png`,
    );
    const bitmap_rem = await fs.readFile(
      `${process.env['PATH_IMGS']}remitente.png`,
    );

    const fondodest = Buffer.from(bitmap_dest, 'binary').toString('base64');
    const fondoent = Buffer.from(bitmap_ent, 'binary').toString('base64');
    const fondorem = Buffer.from(bitmap_rem, 'binary').toString('base64');

    const fondos = [fondodest, fondoent, fondorem];

    const renderHtml = await ejs.renderFile(
      `${process.env['PATH_TEMPLATES']}crystal.ejs`,
      {
        guias: guides,
        fondos,
      },
    );

    return renderHtml;
  }

  async downloadPdf(query) {
    try {
      let base64;
      const browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });

      const page = await browser.newPage();
      await page.goto(
        `https://orion-services-bucket.s3.eu-west-1.amazonaws.com/${query.filename}`,
        {
          waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
        },
      );

      try {
        const pdf = await page.pdf({
          format: 'a4',
          timeout: 1000 * 60 * 60,
        });

        const _base64 = await pdf;
        base64 = _base64.toString('base64');
      } catch (error) {
        console.log(error);
      } finally {
        await browser.close();
      }

      return {
        statusCode: HttpStatusCode.Ok,
        statusText: 'Success',
        message: 'PDF obtenido correctamente',
        file: base64,
      };
    } catch (error) {
      return {
        statusCode: HttpStatusCode.Conflict,
        statusText: 'Conflict',
        message:
          'Ha ocurrido un error inesperado, por favor contecte al equipo de soporte técnico de Domina.',
      };
    }
  }
}
