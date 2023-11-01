import { Injectable } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  async putFile(filename, file, type: string, isPublic: boolean = false) {
    const s3 = new S3({
      region: process.env.AWS_S3_REGION,
    });
    const command = new PutObjectCommand({
      Bucket: process.env['BUCKET_S3_NAME'],
      Key: filename,
      Body: file,
      ContentType: type,
      ACL: isPublic ? 'public-read' : 'private'
    });

    return await s3.send(command);
  }

  async getFile(filename) {
    const s3 = new S3({});
    const command = new GetObjectCommand({
      Bucket: process.env['BUCKET_S3_NAME'],
      Key: filename,
    });

    const file = await s3.send(command);

    return file.Body.transformToString('base64');
  }
}
