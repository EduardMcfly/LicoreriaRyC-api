<!--
title: 'LicoreriaRyC GraphQL with TypeScript And DynamoDB'
layout: Doc
description: 'This is GraphQL API for LicoreriaRyC with TypeScript and DynamoDB.'
framework: v2
platform: AWS
language: nodeJS
authorLink: 'https://github.com/EduardMcfly'
authorName: 'Jan Jun'
authorAvatar: 'https://avatars.githubusercontent.com/u/16842163?v=4'
-->

# LicoreriaRyC GraphQL with TypeScript And DynamoDB

This is GraphQL API for LicoreriaRyC with TypeScript and DynamoDB

## Use Cases

- API for a Web Application
- API for a Mobile Application
- GraphQL API with typescript
- Dynamic image resizing
- DynamoDB data storage
- Multi-environment management under Serverless
- Mocha unit tests and lambda-tester interface test
- AWS lambda function log view

## Setup

```bash
npm install
```

## Deploy

### To Test It Locally

- Run `npm install` to install all the necessary dependencies.
- Run `npm run start` use serverless offline to test locally.

### Deploy on AWS, simply run:

```
serverless deploy
```

The expected result should be similar to:

```
Serverless: Compiling with Typescript...
Serverless: Using local tsconfig.json
Serverless: Typescript compiled.
Serverless: Packaging service...
Serverless: Excluding development dependencies...
Serverless: Uploading CloudFormation file to S3...
Serverless: Uploading artifacts...
Serverless: Uploading service licoreriaryc-api.zip file to S3 (1.86 MB)...
Serverless: Validating template...
Serverless: Updating Stack...
Serverless: Checking Stack update progress...
......................................
Serverless: Stack update finished...
Service Information
service: licoreriaryc-api
stage: dev
region: us-east-1
stack: licoreriaryc-api-dev
resources: 32
api keys:
  None
endpoints:
  GET - https://xxxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/graphql
  POST - https://xxxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/graphql
  GET - https://xxxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/getImage?file=xxxxxxxxxxxxxxxxxx
functions:
  graphql: licoreriaryc-api-dev-graphql
  getImage: licoreriaryc-api-dev-getImage
layers:
  None
Serverless: Removing old service artifacts from S3...
Serverless: Run the "serverless" command to setup monitoring, troubleshooting and testing.
```

## Usage

send an HTTP request directly to the endpoint using a tool like curl

```
curl https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/graphql
```

No output

## Scaling

### AWS Lambda

By default, AWS Lambda limits the total concurrent executions across all functions within a given region to 100. The default limit is a safety limit that protects you from costs due to potential runaway or recursive functions during initial development and testing. To increase this limit above the default, follow the steps in [To request a limit increase for concurrent executions](http://docs.aws.amazon.com/lambda/latest/dg/concurrent-executions.html#increase-concurrent-executions-limit).

### DynamoDB

When you create a table, you specify how much provisioned throughput capacity you want to reserve for reads and writes. DynamoDB will reserve the necessary resources to meet your throughput needs while ensuring consistent, low-latency performance. You can change the provisioned throughput and increasing or decreasing capacity as needed.

This is can be done via settings in the `serverless.yml`.

```yaml
ProvisionedThroughput:
  ReadCapacityUnits: 1
  WriteCapacityUnits: 1
```

In case you expect a lot of traffic fluctuation we recommend to checkout this guide on how to auto scale DynamoDB [https://aws.amazon.com/blogs/aws/auto-scale-dynamodb-with-dynamic-dynamodb/](https://aws.amazon.com/blogs/aws/auto-scale-dynamodb-with-dynamic-dynamodb/)
