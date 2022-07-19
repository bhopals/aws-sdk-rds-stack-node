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

  // accessing environment variables 👇
  console.log("region 👉", process.env.region);
  console.log("availabilityZones 👉", process.env.availabilityZones);
  console.log("endpoint 👉", process.env.endpoint);
  console.log("port 👉", process.env.port);
  console.log("databaseName 👉", process.env.databaseName);
  console.log("userName 👉", process.env.userName);
  console.log("password 👉", process.env.password);

  const sqlConfig = {
    user: process.env.userName,
    password: process.env.password,
    database: process.env.databaseName,
    host: process.env.endpoint,
    // pool: {
    //   max: 10,
    //   min: 0,
    //   idleTimeoutMillis: 30000,
    // },
    // options: {
    //   encrypt: true, // for azure
    //   trustServerCertificate: false, // change to true for local dev / self-signed certs
    // },
  };

  let response;
  try {
    // make sure that any items are correctly URL encoded in the connection string
    console.log("BEFORE>sqlConfig>", sqlConfig);
    let connection = await mysql.createConnection(sqlConfig);
    console.log("connect>>", connection);

    // //CREATE DATABASE
    // const db = await connection.query(
    //   `CREATE DATABASE mydb${Math.floor(Math.random() * 100)}`
    // );
    // const tb = await connection.query(
    //   `CREATE TABLE customers (name VARCHAR(255), address VARCHAR(255))`
    // );

    // const rec = await connection.query(
    //   `INSERT INTO customers (name, address) VALUES ('Company Inc', 'Highway 37')`
    // );

    // const result = await connection.query(`select * from customers`);
    const [result, fields] = await connection.execute(
      "SELECT * FROM `table` WHERE `name` = ? AND `age` > ?",
      ["Morty", 14]
    );

    console.dir("result>", result);
    console.dir("fields>", fields);

    response = {
      body: JSON.stringify({
        result,
        fields,
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
