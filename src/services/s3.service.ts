import { Injectable } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import https from 'https';
import { NodeHttpHandler } from '@smithy/node-http-handler';

const sslAgent = new https.Agent({ rejectUnauthorized: !process.env.IS_OFFLINE });
const s3 = new S3({
  requestHandler: new NodeHttpHandler({
    httpsAgent: sslAgent,
    httpAgent: sslAgent
  })
});

@Injectable()
export class S3Service {
  async putFile(filename, file) {
    const command = new PutObjectCommand({
      Bucket: process.env['BUCKET_S3_NAME'],
      Key: filename,
      Body: file,
    });

    await s3.send(command);
  }

  async getFile(filename) {
    const command = new GetObjectCommand({
      Bucket: process.env['BUCKET_S3_NAME'],
      Key: filename
    });

    const file =  await s3.send(command);

    return file.Body.transformToString('base64');
  }
}