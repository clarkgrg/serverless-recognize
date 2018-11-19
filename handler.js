'use strict';
const Twitter = require('twitter');
const config = require('./config');
const { getLastId, saveLastId, interpretImage } = require('./libs/awstools');

// Initialize Twitter
var T = new Twitter(config);

// Send a tweet
const sendTweet = async (tweetText, questionTweetId) => {
  try {
    let tweet = await T.post('statuses/update', { status: tweetText, in_reply_to_status_id: questionTweetId });
    return tweet;  
  } catch (err) {
    console.log(err);
  }
}

// Get a tweet sent to us
const getTimeLineTweet = async (lastId) => {
  try {
    let tweets = await T.get('statuses/mentions_timeline', 
      { since_id: lastId, count: 1 });

    if (tweets && tweets.length > 0) {
      return tweets[0];
    } else {
      return null;
    }
  } catch (err) {
    console.log(err);
    return null;
  }
}

// Get the Url of the image in the tweet
const getImageUrl = (tweet) => {
  if (tweet && tweet.entities && tweet.entities.media[0] && tweet.entities.media[0].media_url) {
    return tweet.entities.media[0].media_url;
  } else {
    return null;
  }
}

// Does the tweet ask a question about the image?
const askImageQuestion = (inString) => {
  const subString = "what's in this image?";
  return inString.toLowerCase().includes(subString);
}

// Main Routine
module.exports.recognize = async (event, context) => {

  // Get any new tweets
  let lastTweetId = await getLastId();
  const tweet = await getTimeLineTweet(lastTweetId);  

  let returnString = '';

  // Did anyone tweet us?
  if (tweet && askImageQuestion(tweet.text)) {
    try {
      // save this tweet id so we only process once
      const questionTweetId = tweet.id_str;
      await saveLastId(questionTweetId);

      const sender = `@${tweet.user.screen_name}`;

      const imageUrl =  getImageUrl(tweet);
      if (imageUrl) {
        // Interpret the Image
        returnString = await interpretImage(imageUrl); 

        // An error occurred
        if (returnString == null) {
          returnString = "You stumped me!";
        }     
      } else {
        returnString = "I don't see an image in the tweet";
      }

      // Send a response tweet
      const responseTweet = `${sender} ${returnString}`;
      const answerTweet = await sendTweet(responseTweet, questionTweetId);  
    } catch (err) {
      console.log(err);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: returnString,
    }),
  };
};
