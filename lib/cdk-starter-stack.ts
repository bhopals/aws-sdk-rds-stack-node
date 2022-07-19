import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";

import { CfnOutput, Aws, SecretValue } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Role, ServicePrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";

import {
  LambdaType,
  LambdaRole,
  handler,
  appName,
  AWS_SDK,
  PUBLIC_LAMBDA_URL,
  PUBLIC_LAMBDA_PATH,
  PRIVATE_LAMBDA_PATH,
  FUN_LABEL,
  ARN_LABEL,
} from "./stackConfiguration";
import {
  Vpc,
  SubnetType,
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  SecurityGroup,
} from "aws-cdk-lib/aws-ec2";
import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  MysqlEngineVersion,
  Credentials,
} from "aws-cdk-lib/aws-rds";

export class CdkStarterStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //// RDS
    const databaseName = "apps";
    const userName = "admin";
    const password = "admin123456";

    const vpc = new Vpc(this, "public-rds-vpc", {
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public-subnet",
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    const fnSg = new SecurityGroup(this, "public-rds-sg", {
      securityGroupName: `${id}PublicRdsSG`,
      vpc: vpc,
      allowAllOutbound: true,
    });

    fnSg.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(3306),
      "allow TCP access from anywhere"
    );

    const dbInstance = new DatabaseInstance(this, "public-db", {
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0_19,
      }),
      vpc,
      instanceIdentifier: `public-db-rds`,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE2,
        InstanceSize.MICRO
      ),
      publiclyAccessible: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      databaseName,
      securityGroups: [fnSg],
      //      credentials: Credentials.fromGeneratedSecret("myname"),
      credentials: Credentials.fromPassword(
        userName,
        new SecretValue(password)
      ),
    });

    //// LAMBDA
    const role = new Role(this, `${appName}-${LambdaRole.NAME}`, {
      assumedBy: new ServicePrincipal(LambdaRole.SERVICE_PRINCIPAL),
    });

    role.addToPolicy(
      new PolicyStatement({
        resources: [
          `${ARN_LABEL}${Aws.REGION}:${Aws.ACCOUNT_ID}${FUN_LABEL}${appName}-${LambdaType.PUBLIC_LAMBDA}`,
          `${ARN_LABEL}${Aws.REGION}:${Aws.ACCOUNT_ID}${FUN_LABEL}${appName}-${LambdaType.PRIVATE_LAMBDA}`,
        ],
        actions: [LambdaRole.ACTIONS],
      })
    );

    /*** PRIVATE LAMBDA FUNCTION */
    const privateLambda = new NodejsFunction(
      this,
      `${appName}-${LambdaType.PRIVATE_LAMBDA}`,
      {
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler,
        role,
        functionName: `${appName}-${LambdaType.PRIVATE_LAMBDA}`,
        entry: path.join(__dirname, PRIVATE_LAMBDA_PATH),
        bundling: {
          minify: false,
          externalModules: [AWS_SDK],
        },
      }
    );

    /*** PUBLIC LAMBDA FUNCTION */
    const publicLambda = new NodejsFunction(
      this,
      `${appName}-${LambdaType.PUBLIC_LAMBDA}`,
      {
        memorySize: 1024,
        functionName: `${appName}-${LambdaType.PUBLIC_LAMBDA}`,
        timeout: cdk.Duration.seconds(5),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler,
        role,
        entry: path.join(__dirname, PUBLIC_LAMBDA_PATH),
        bundling: {
          minify: false,
          externalModules: [AWS_SDK],
        },
        environment: {
          region: cdk.Stack.of(this).region,
          availabilityZones: JSON.stringify(
            cdk.Stack.of(this).availabilityZones
          ),
          endpoint: dbInstance.dbInstanceEndpointAddress,
          port: dbInstance.dbInstanceEndpointPort,
          databaseName,
          userName,
          password,
        },
      }
    );

    const fnUrl = publicLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    new CfnOutput(this, PUBLIC_LAMBDA_URL, {
      value: fnUrl.url,
    });
  }
}
