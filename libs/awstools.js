const AWS = require('aws-sdk');
const { getImage } = require('./fetch');

// Initialize AWS
AWS.config.update({
  region: process.env.region
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const _idName = "LASTID";

const rekognition = new AWS.Rekognition();

// Get the last tweet Id processed
const getLastId = async () => {
  const params = {
    TableName: process.env.tableName,
    KeyConditionExpression: "idName = :idName",
    ExpressionAttributeValues: {
      ":idName": _idName
    },
    Limit: 1
  };
  let lastId = '1';

  try {
    let data = await dynamoDb.query(params).promise();
    // Did we return data items?
    if (Object.keys(data).length !== 0) {
      lastId = data.Items[0].tweetId;
    } 
  } catch(err) {
    console.log("ERROR: " + err);
  } 
  return lastId;    
}

// Save the last tweet Id
const saveLastId = async (lastId) => {
  const params = {
    TableName: process.env.tableName,
    Item: {
      idName: _idName,
      tweetId: lastId
    }
  };  

  try {
    // Add to dynamoDB
    let response = await dynamoDb.put(params).promise();
    
    return response;
  } catch (err) {
    console.log(err);
    return null;
  }
}

// Is this animal a turkey?
const isATurkey = (labels) => {
  const subString = 'turkey';
  let isTurkey = false;
  labels.forEach(label => {
    if (label.Name.toLowerCase().includes(subString)) {
      isTurkey = true;
    }
  });
  return isTurkey;
}

// Determine what's in the image
const interpretImage = async (imageUrl) => {
  const imageBytes = await getImage(imageUrl);
  const params = {
    Image: {            
        Bytes: imageBytes
    },
    MaxLabels: 5,
    MinConfidence: 80,
  };

  try {
    const data = await rekognition.detectLabels(params).promise();
  
    if (data.Labels && data.Labels.length > 0) {
      // special turkey case for Thanksgiving
      if (isATurkey(data.Labels)) {
        return 'It is Dinner (100%)';
      } else {
        const labelString = data.Labels.map((label) => {
          return `${label.Name} (${Math.floor(label.Confidence)}%)`;
        }).join(' or ');
        return `It is ${labelString}`;
      }
    } else {
      return "I don't know what that is";
    }
  } catch (err) {
    console.log(err);
    return null;
  }
}

module.exports = {
  getLastId, 
  saveLastId, 
  isATurkey,
  interpretImage
};