import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Bucket } from "aws-cdk-lib/aws-s3";

import { CfnOutput, Aws, SecretValue } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  Effect,
  AnyPrincipal,
  ManagedPolicy,
} from "aws-cdk-lib/aws-iam";

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
  RDS_DB_NAME,
  RDS_DB_USER,
  RDS_DB_PASSWORD,
  RDS_ENDPOINT,
  RDS_SG_ALLOW_TCP,
  RDS_VPC_ID,
  RDS_INSTANCE_ID,
  RDS_INSTANCE_NAME,
  RDS_SECURITY_GROUP_ID,
  RDS_SECURITY_GROUP_NAME,
  RDS_SUBNET_NAME,
  S3_BUCKET_NAME,
  S3_BUCKET_ID,
  S3_BUCKET_ARN,
  S3_PRINCIPAL,
  S3_GET_OBJECT,
  S3_DELETE_OBJECT,
  S3_PUT_OBJECT,
  LAMBDA_SERVER_PATH,
  SERVER_LAMBDA_URL,
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

    /*** RDS INSTANCE (VPC + SUBNET + SECURITY GROUP + MYSQL Instance) */
    const dbInstance = this.createRDSInstance(id);

    /*** S3 BUCKET */
    const bucket = this.createS3Bucket();

    /*** LAMBDA ROLE */
    const role = this.createLambdaRole();

    /*** PRIVATE LAMBDA FUNCTION */
    const privateLambda = this.createPrivateLambda(role);

    /*** PUBLIC LAMBDA SERVER FUNCTION */
    const nodeJsServer = this.createNodeJsServer(role, dbInstance, bucket);

    /*** PUBLIC LAMBDA FUNCTION */
    const publicLambda = this.createPublicLambda(role, dbInstance, bucket);
    bucket.grantReadWrite(publicLambda);

    /** Expose LAMDA SERVER LAMBDA URL*/
    const fnServerUrl = nodeJsServer.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    /** OUTPUT NODEJS SERVER LAMBDA URL*/
    new CfnOutput(this, SERVER_LAMBDA_URL, {
      value: fnServerUrl.url,
    });

    /** Expose PUBLIC LAMBDA URL*/
    const fnUrl = publicLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    /** OUTPUT PUBLIC LAMBDA UR*/
    new CfnOutput(this, PUBLIC_LAMBDA_URL, {
      value: fnUrl.url,
    });

    /** OUTPUT DB INSTANCE ENDPOINT*/
    new CfnOutput(this, RDS_ENDPOINT, {
      value: dbInstance.dbInstanceEndpointAddress,
    });

    /** OUTPUT S3 BUCKET NAME*/
    new CfnOutput(this, S3_BUCKET_NAME, {
      value: bucket.bucketName,
    });

    /** OUTPUT S3 BUCKET NAME Public BUCKET name region az*/
    new CfnOutput(this, S3_BUCKET_ARN, {
      value: bucket.bucketArn,
    });
  }

  private createRDSInstance(id: string) {
    const vpc = new Vpc(this, RDS_VPC_ID, {
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: RDS_SUBNET_NAME,
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    const fnSg = new SecurityGroup(this, RDS_SECURITY_GROUP_ID, {
      securityGroupName: RDS_SECURITY_GROUP_NAME,
      vpc: vpc,
      allowAllOutbound: true,
    });

    fnSg.addIngressRule(Peer.anyIpv4(), Port.tcp(3306), RDS_SG_ALLOW_TCP);

    const dbInstance = new DatabaseInstance(this, RDS_INSTANCE_ID, {
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0_19,
      }),
      vpc,
      instanceIdentifier: RDS_INSTANCE_NAME,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE2,
        InstanceSize.MICRO
      ),
      publiclyAccessible: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      databaseName: RDS_DB_NAME,
      securityGroups: [fnSg],
      //credentials: Credentials.fromGeneratedSecret("myname"),
      credentials: Credentials.fromPassword(
        RDS_DB_USER,
        new SecretValue(RDS_DB_PASSWORD)
      ),
    });
    return dbInstance;
  }

  private createPublicLambda(role: Role, db: DatabaseInstance, bucket: Bucket) {
    return new NodejsFunction(this, `${appName}-${LambdaType.PUBLIC_LAMBDA}`, {
      memorySize: 1024,
      functionName: `${appName}-${LambdaType.PUBLIC_LAMBDA}`,
      timeout: cdk.Duration.seconds(500),
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
        availabilityZones: JSON.stringify(cdk.Stack.of(this).availabilityZones),
        endpoint: db.dbInstanceEndpointAddress,
        port: db.dbInstanceEndpointPort,
        databaseName: RDS_DB_NAME,
        userName: RDS_DB_USER,
        password: RDS_DB_PASSWORD,
        bucketName: bucket.bucketName,
        bucketArn: bucket.bucketArn,
      },
    });
  }

  private createNodeJsServer(role: Role, db: DatabaseInstance, bucket: Bucket) {
    return new NodejsFunction(this, `${appName}-${LambdaType.LAMBDA_SERVER}`, {
      memorySize: 1024,
      functionName: `${appName}-${LambdaType.LAMBDA_SERVER}`,
      timeout: cdk.Duration.seconds(500),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler,
      role,
      entry: path.join(__dirname, LAMBDA_SERVER_PATH),
      bundling: {
        minify: false,
        externalModules: [AWS_SDK],
      },
      environment: {
        region: cdk.Stack.of(this).region,
        availabilityZones: JSON.stringify(cdk.Stack.of(this).availabilityZones),
        endpoint: db.dbInstanceEndpointAddress,
        port: db.dbInstanceEndpointPort,
        databaseName: RDS_DB_NAME,
        userName: RDS_DB_USER,
        password: RDS_DB_PASSWORD,
        bucketName: bucket.bucketName,
        bucketArn: bucket.bucketArn,
      },
    });
  }

  private createPrivateLambda(role: Role) {
    return new NodejsFunction(this, `${appName}-${LambdaType.PRIVATE_LAMBDA}`, {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(500),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler,
      role,
      functionName: `${appName}-${LambdaType.PRIVATE_LAMBDA}`,
      entry: path.join(__dirname, PRIVATE_LAMBDA_PATH),
      bundling: {
        minify: false,
        externalModules: [AWS_SDK],
      },
    });
  }

  private createLambdaRole() {
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

    // role.addManagedPolicy(
    //   ManagedPolicy.fromAwsManagedPolicyName("AmazonAPIGatewayInvokeFullAccess")
    // );
    return role;
  }

  private createS3Bucket() {
    const bucket = new Bucket(this, S3_BUCKET_ID, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    bucket.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        principals: [new AnyPrincipal()],
        actions: [S3_GET_OBJECT, S3_DELETE_OBJECT, S3_PUT_OBJECT],
        resources: [`${bucket.bucketArn}/${S3_PRINCIPAL}`],
      })
    );

    return bucket;
  }
}
