import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from 'constructs';

export class SmartCrawlerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    const s3Bucket = new s3.Bucket(this, 'KnowledgeBaseBucket',{
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });    
    
    //Attach policies to IAM role
    const lambda_role = new iam.Role(this, 'CrawlerLambdaRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
      });
    // add all required policies
    lambda_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"))
    const S3BucketsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:*'],
      resources: [`${s3Bucket.bucketArn}/*`],
    });
    lambda_role.attachInlinePolicy(
      new iam.Policy(this, 'KBBucketAccess', {
        statements: [S3BucketsPolicy],
      }),
    );
    // create a lambda function
    const fn = new lambda.Function(this, "GenAICrawlerFunction", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: "genai_crawler.lambda_handler",
      role:lambda_role,
      code: lambda.Code.fromAsset("./lambda/", {
        bundling: {
          image: lambda.Runtime.PYTHON_3_11.bundlingImage,
          command: [
            'bash', '-c',
            "pip install -r requirements.txt -t /asset-output && cp -au . /asset-output"
          ],
        },
      }),
      environment: {
        BUCKETNAME: s3Bucket.bucketName
      },
      timeout: Duration.seconds(900)
    });
    
    // create an Output
    new cdk.CfnOutput(this, 'BucketName', {
      value: s3Bucket.bucketName,
      description: 'The name of the s3 bucket',
      exportName: 'BedrockKnowledgeBaseBucket',
    });
  }
}
