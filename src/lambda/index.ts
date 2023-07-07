/* eslint-disable @typescript-eslint/require-await */
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { Lambda } from "@aws-sdk/client-lambda";
import { TextDecoder, TextEncoder } from "util";
import {
  appName,
  LambdaType,
  INVOCATION_TYPE,
  UTF_8,
} from "../../lib/stackConfiguration";

import {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const mysql = require("mysql2/promise");

export async function main(
  event: APIGatewayProxyEventV2,
  context: any
): Promise<APIGatewayProxyResultV2> {
  console.log(event);
  console.log(context);

  const sqlConfig = {
    user: process.env.userName,
    password: process.env.password,
    database: process.env.databaseName,
    host: process.env.endpoint,
  };

  let response = {} as any;
  const tableName = "SUPER_USER_T";
  try {
    let connection = await mysql.createConnection(sqlConfig);

    //LIST ALL DATABASES
    const [rows] = await connection.query("show databases");
    response.databases = rows;

    //LIST ALL TABLES
    const [tables] = await connection.query("show tables");

    const isTableExists = tables.some(
      (el: any) => el.Tables_in_apps === tableName
    );
    if (!isTableExists) {
      //CREATE TABLE
      await connection.execute(
        `CREATE TABLE Users (id VARCHAR(255), name VARCHAR(255))`
      );
    }

    //INSERT RECORD IN TABLE
    await connection.execute(
      `INSERT INTO ${tableName} (id, name) VALUES('111', 'ZZZZ')`
    );

    //RETRIEVE RECORDS
    const [result] = await connection.execute(`SELECT * FROM ${tableName}`);

    //S3 Bucket
    const client = new S3Client({});
    const listCommand = new ListObjectsCommand({
      Bucket: process.env.bucketName,
    });

    const putCommand = new PutObjectCommand({
      Bucket: process.env.bucketName,
      Key: "test-key",
      Body: "TEST STRING TO BE STORED>>>",
    });

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.bucketName,
      Key: "1658592727_clients.jpeg",
    });

    const s3ListResponse = await client.send(listCommand);
    const s3PutResponse = await client.send(putCommand);
    const s3DeleteResponse = await client.send(deleteCommand);

    console.log("s3ListResponse>>>", s3ListResponse);

    response = {
      body: JSON.stringify({
        result,
        tables,
        s3ListResponse,
        s3PutResponse,
        s3DeleteResponse,
      }),
      statusCode: 200,
    };
  } catch (err) {
    console.log("ERR>", err);
    response = {
      body: JSON.stringify({
        err,
      }),
      statusCode: 500,
    };
  }

  console.log(response);
  return response;
}
