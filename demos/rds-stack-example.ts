// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "@aws-cdk/core";
import { CfnOutput, Duration, SecretValue, Stack, Token } from "@aws-cdk/core";
import { CdkResourceInitializer } from "../lib/resource-initializer";
import { DockerImageCode } from "@aws-cdk/aws-lambda";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "@aws-cdk/aws-ec2";
import { RetentionDays } from "@aws-cdk/aws-logs";
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  DatabaseSecret,
  MysqlEngineVersion,
} from "@aws-cdk/aws-rds";

export class RdsStackExample extends Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const instanceIdentifier = "rds-instance";
    const credsSecretName =
      `/${id}/rds/creds/${instanceIdentifier}`.toLowerCase();
    const creds = new DatabaseSecret(this, "public-rds", {
      secretName: credsSecretName,
      username: "admin",
    });

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
      databaseName: `apps`,
      securityGroups: [fnSg],
      //      credentials: Credentials.fromGeneratedSecret("myname"),
      credentials: Credentials.fromPassword(
        "admin",
        new SecretValue("admin123456")
      ),
    });

    /* eslint no-new: 0 */
    new CfnOutput(this, "RdsStackInstance", {
      value: Token.asString(dbInstance.toString()),
    });
  }
}
