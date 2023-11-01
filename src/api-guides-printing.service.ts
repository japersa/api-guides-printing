import { Injectable } from '@nestjs/common';
import { FiltersDto } from './dto/filters.dto';
import { ShipmentsService } from './services/shipments.service';
import { DateFunctions } from './common/utils/date-functions';
import BarcodeWriter from 'bwip-js';
import crypto from 'crypto';
import fs from 'promise-fs';
import ejs from 'ejs';
import puppeteer from 'puppeteer-core';
import { S3Service } from './services/s3.service';
import { HttpStatusCode } from 'axios';
import chromium from '@sparticuz/chromium';

@Injectable()
export class ApiGuidesPrintingService {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly s3Service: S3Service
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async guidesPrinting(
    client,
    filters: FiltersDto
  ) {
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
          const _base64 = await file.pdf;
          base64 = _base64.toString('base64');
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
            await this.s3Service.putFile(file.filename, file.pdf);
            filenames.push(file.filename);
          }

          filename = filenames;
        }

        response = {
          statusCode: HttpStatusCode.Ok,
          statusText: 'Created',
          message: 'PDF creado correctamente.',
          filename,
          base64
        };
      } else {
        response = {
          statusCode: HttpStatusCode.Ok,
          statusText: 'Conflict',
          message: 'No se encontró ningún registro asociado al filtro ingresado.'
        };
      }
    } catch (error) {
      response = {
        statusCode: HttpStatusCode.Conflict,
        statusText: 'Conflict',
        message: 'No es posible procesar la petición, comuniquese con el area de soporte.'
      };
      console.log(error);
    }

    return response;
  }

  private async _getGuides(filters, client) {
    let guides;
    if (filters.guias !== undefined && filters.guias.length > 0) {
      guides = await this.shipmentsService._getGuidesByIds(filters.guias, client);
    } else {
      const initialDate = DateFunctions.getDateShort(filters.fechaInicial);
      const finalDate = DateFunctions.getDateShort(filters.fechaFinal);
      
      guides = await this.shipmentsService._getGuidesByDates(initialDate, finalDate, client);
    }

    return guides.Items;
  }

  private async _generateBarcode(guide) {
    const barcode =  await BarcodeWriter.toBuffer({
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
    return `${randomString}_${timestamp}.pdf`;
  }

  private async _generateAndReturnPdf(guides) {
    let pdf;
    const filename = await this._generateFileName();
    const htmlRendered = await this._renderTemplatePDF(guides);
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--font-render-hinying none'
      ],
      userDataDir: '/tmp',
      executablePath: await chromium.executablePath()
    });
    const page = await browser.newPage();
    try {
      await page.setContent(htmlRendered);
      pdf = await page.pdf({
        format: 'A4',
        timeout: 1000 * 60 * 60
      });
    } catch (error) {
      console.log(error);
    } finally {
      await browser.close();
    }

    return {filename, pdf};
  }

  private async _renderTemplatePDF(guides) {
    const bitmap_dest = await fs.readFile(
      `./apps/api-guides-printing/assets/imgs/destinatario.png`,
    );
    const bitmap_ent = await fs.readFile(
      `./apps/api-guides-printing/assets/imgs/entrega.png`,
    );
    const bitmap_rem = await fs.readFile(
      `./apps/api-guides-printing/assets/imgs/remitente.png`,
    );

    const fondodest = Buffer.from(bitmap_dest, 'binary').toString('base64');
    const fondoent = Buffer.from(bitmap_ent, 'binary').toString('base64');
    const fondorem = Buffer.from(bitmap_rem, 'binary').toString('base64');

    const fondos = [fondodest, fondoent, fondorem];

    const renderHtml = await ejs.renderFile(`./apps/api-guides-printing/assets/templates/crystal.ejs`, {
      guias: guides,
      fondos
    });

    return renderHtml;
  }

  async downloadPdf(query) {
    try {
      const object = await this.s3Service.getFile(query.filename);

      return {
        statusCode: HttpStatusCode.Ok,
        statusText: 'Success',
        message: 'PDF obtenido correctamente',
        file: object
      };
    } catch (error) {
      return {
        statusCode: HttpStatusCode.Conflict,
        statusText: 'Conflict',
        message: 'Ha ocurrido un error inesperado, por favor contecte al equipo de soporte técnico de Domina.'
      };
    }
  }
}
