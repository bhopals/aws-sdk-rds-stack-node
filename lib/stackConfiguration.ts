export const UTF_8 = "utf-8";
export const AWS_SDK = "aws-sdk";
export const handler: string = "main";
export const region: string = "us-west-2";
export const appName: string = "rds-stack";

export const FUN_LABEL: string = ":function:";
export const ARN_LABEL: string = "arn:aws:lambda:";
export const INVOCATION_TYPE = "RequestResponse";

export const BASE_PATH: string = "/../src/lambda";
export const PUBLIC_LAMBDA_URL: string = "publicLambdaUrl";
export const PUBLIC_LAMBDA_PATH: string = `${BASE_PATH}/index.ts`;
export const PRIVATE_LAMBDA_PATH: string = `${BASE_PATH}/internal.ts`;

export enum LambdaRole {
  NAME = "private-lambda-access-role",
  ACTIONS = "lambda:InvokeFunction",
  SERVICE_PRINCIPAL = "lambda.amazonaws.com",
}

export enum LambdaType {
  PUBLIC_LAMBDA = "public-lambda",
  PRIVATE_LAMBDA = "private-lambda",
}
