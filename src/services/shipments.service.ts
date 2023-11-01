import { Injectable, Inject } from '@nestjs/common';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

@Injectable()
export class ShipmentsService {
  constructor(
    @Inject('DYNAMODB_CONNECTION')
    private readonly dynamoDB: DocumentClient
  ) {}

  async _getGuidesByIds(guides, client) {
    const filterExpression = guides.map(guide => `#id = :values${guide}`).join(' OR ');

    const expressionValues = {
      ':cliente_id': client.id
    };
    
    guides.forEach(guide => {
      expressionValues[`:values${guide}`] = Number(guide);
    });

    const params = {
      TableName: process.env['SHIPMENTS_FOR_PRINTING_TABLE'],
      FilterExpression: '#client_id = :cliente_id AND ' + filterExpression,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: {
        '#client_id': 'cliente_id',
        '#id': 'id'
      }
    };

    return this.dynamoDB.scan(params);
  }

  async _getGuidesByDates(initialDate, finalDate, client) {
    const params = {
      TableName: process.env['SHIPMENTS_FOR_PRINTING_TABLE'],
      FilterExpression: '#clientId = :clientId AND #createdAt BETWEEN :initialDate AND :finalDate',
      ExpressionAttributeNames: {
        '#createdAt': 'createdAt',
        '#clientId': 'cliente_id'
      },
      ExpressionAttributeValues: {
        ':initialDate': initialDate,
        ':finalDate': finalDate,
        ':clientId': client.id
      }
    };

    return this.dynamoDB.scan(params);
  }
}