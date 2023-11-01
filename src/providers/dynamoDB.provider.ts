import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const marshallOptions = {
  removeUndefinedValues: true,
  convertClassInstanceMap: true,
};

const configurationDynamo = 
  process.env.IS_OFFLINE ?
  {
    region: 'eu-west-1',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'AKIASAS7VYOCDPIZUXMN',
    secretAccessKey: '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'
  } :
  {};


export const DynamoDBProvider = {
  provide: 'DYNAMODB_CONNECTION',
  useFactory: () => DynamoDBDocument.from(new DynamoDB(configurationDynamo), { marshallOptions }),
};
