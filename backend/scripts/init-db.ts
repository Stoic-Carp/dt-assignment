import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const config: any = {
    region: process.env.AWS_REGION || 'us-east-1',
};

if (process.env.DYNAMODB_ENDPOINT) {
    config.endpoint = process.env.DYNAMODB_ENDPOINT;
    config.credentials = {
        accessKeyId: 'local',
        secretAccessKey: 'local'
    };
}

const client = new DynamoDBClient(config);

const TABLE_NAME = process.env.TABLE_NAME || 'Todos';

const createTable = async () => {
    try {
        const listCommand = new ListTablesCommand({});
        const { TableNames } = await client.send(listCommand);

        if (TableNames?.includes(TABLE_NAME)) {
            console.log(`Table ${TABLE_NAME} already exists.`);
            return;
        }

        const command = new CreateTableCommand({
            TableName: TABLE_NAME,
            AttributeDefinitions: [
                { AttributeName: 'id', AttributeType: 'S' }
            ],
            KeySchema: [
                { AttributeName: 'id', KeyType: 'HASH' }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        });

        await client.send(command);
        console.log(`Table ${TABLE_NAME} created successfully.`);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
};

createTable();
