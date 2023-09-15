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

var mysql = require("mysql2/promise");

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
  const tableName = "Users";
  const cloumns = [
    "id",
    "name",
    "email",
    "password",
    "date-of-birth",
    "address",
    "postal-code",
  ];

  try {
    let connection = await mysql.createConnection(sqlConfig);

    //LIST DATABASES
    const [rows] = await connection.query("show databases");
    response.databases = rows;
    console.log("response.databases>", response.databases);
    //LIST TABLES
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

    response = {
      body: JSON.stringify({
        result,
        tables,
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
