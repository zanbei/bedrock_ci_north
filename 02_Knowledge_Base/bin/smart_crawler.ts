#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SmartCrawlerStack } from '../lib/smart_crawler-stack';

const app = new cdk.App();
new SmartCrawlerStack(app, 'SmartCrawlerStack');
