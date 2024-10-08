import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiErrors } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  const { content } = req.body;

  if (!content) {
    throw new ApiErrors(400, "provide the content");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  if (!tweet) {
    throw new ApiErrors(500, "something went wrong when creating your tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet made successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiErrors(400, "provide proper userid");
  }

  const userTweets = await Tweet.aggregate([
    {
      $match: { owner: userId },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerOfTweet",
      },
    },
    {
      $unwind: "$ownerOfTweet",
    },
    {
      $project: {
        owner: "$ownerOfTweet",
        content: 1,
      },
    },
  ]);

  if (!userTweets.length) {
    throw new ApiErrors(408, "user have no tweets yet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiErrors(400, "provide proper tweet id");
  }

  if (!content) {
    throw new ApiErrors(400, "provide proper description");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiErrors(404, "This tweet does not exist");
  }

  if (!tweet.owner.toString().equels(req.user._id.toString())) {
    throw new ApiErrors(
      408,
      "You are not the owner of this tweet unable to edit"
    );
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updateTweet) {
    throw new ApiErrors(500, "something went wrong when updating your tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateTweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiErrors(400, "provide proper tweet id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiErrors(404, "This tweet does not exist");
  }

  if (!tweet.owner.toString().equels(req.user._id.toString())) {
    throw new ApiErrors(
      408,
      "You are not the owner of this tweet unable to edit"
    );
  }

  const deleted = await Tweet.findByIdAndDelete(tweetId);

  if (!deleted) {
    throw new ApiErrors(500, "something went wrong when deleting your tweet");
  }

  return res.status(200).json(new ApiResponse(200, "deleted"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
