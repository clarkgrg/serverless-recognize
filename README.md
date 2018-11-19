# Serverless-Recognize

A Serverless Twitter Bot that recognizes animals

## How to Use

Tweet '@clarkgrg What's in this image?' and include an image

The bot is currently set to reply within 15 minutes

## How to configure

add a config.js file replacing the capitalized keys with your specific keys

```javascript
module.exports = {
  consumer_key: 'CONSUMER-KEY',
  consumer_secret: 'CONSUMER-SECRET',
  access_token_key: 'ACCESS-TOKEN-KEY',
  access_token_secret: 'ACCESS-TOKEN-SECRET'
}
```

The serverless.yml is configured to build a dynamodb table automagically to keep the last tweet Id.