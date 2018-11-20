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

// Get a tweet sent to us.  Process at most 5 a time
const getTimeLineTweets = async (lastId) => {
  try {
    let tweets = await T.get('statuses/mentions_timeline', 
      { since_id: lastId, count: 5 });

    if (tweets && tweets.length > 0) {
      return tweets;
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
  if (tweet && tweet.entities && tweet.entities.media && tweet.entities.media[0] && tweet.entities.media[0].media_url) {
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
  const tweets = await getTimeLineTweets(lastTweetId);  

  let returnString = '';
  let allResponseTweets = '';

  // Did anyone tweet us?
  if (tweets) {
    for (let i = 0; i< tweets.length; i++) {
      returnString = '';
      let tweet = tweets[i];
      if (askImageQuestion(tweet.text)) {
        try {
          // save this tweet id so we only process once
          let questionTweetId = tweet.id_str;
          await saveLastId(questionTweetId);

          let sender = `@${tweet.user.screen_name}`;

          let imageUrl =  getImageUrl(tweet);
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
          let responseTweet = `${sender} ${returnString}`;
          let answerTweet = await sendTweet(responseTweet, questionTweetId);  

          // Write responseTweet for monitoring
          console.log(responseTweet);

          allResponseTweets = allResponseTweets + responseTweet + ', ';
        } catch (err) {
          console.log(err);
        }
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: allResponseTweets,
    }),
  };
};
