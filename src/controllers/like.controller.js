import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiErrors } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { json } from "express";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  const ifLiked = await Like.findOne({ video: videoId, likedBy: req.user._id });

  if (!ifLiked) {
    try {
      await Like.create({
        video: videoId,
        likedBy: req.user._id,
      });

      return res.status(200).json(new ApiResponse(200, "liked", "like added"));
    } catch (error) {
      throw new ApiErrors(500, "something went wrong while adding your like");
    }
  } else {
    try {
      await Like.findOneAndDelete({ video: videoId, likedBy: req.user._id });

      return res
        .status(200)
        .json(new ApiResponse(200, "unliked ", "like removed"));
    } catch (error) {
      throw new ApiErrors(
        500,
        "something went wrong when removing your like !!"
      );
    }
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!commentId || isValidObjectId(commentId)) {
    throw new ApiErrors(400, "give proper comment id");
  }

  const ifCommentExist = await Comment.findById(commentId);

  if (!ifCommentExist) {
    throw new ApiErrors(404, "The comment not found");
  }

  const likeOnComment = await Like.findOne({
    likedBy: req.user._id,
    comment: commentId,
  });

  if (!likeOnComment) {
    try {
      await Like.create({
        comment: commentId,
        likedBy: req.user._id,
      });

      return res.status(200).json(new ApiResponse(200, "liked", "like added"));
    } catch (error) {
      throw new ApiErrors(500, "something went wrong when adding like");
    }
  } else {
    try {
      await Like.findByIdAndDelete(likeOnComment._id);

      return res.status(200);
      json(new ApiResponse(200, "unliked", "like removed"));
    } catch (error) {
      throw new ApiErrors(
        500,
        "something went wrong when removing your like on comment"
      );
    }
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if (!tweetId || isValidObjectId(tweetId)) {
    throw new ApiErrors(404, "provide tweet id");
  }

  const ifTweetExist = await Tweet.findById(tweetId);

  if (!ifTweetExist) {
    throw new ApiErrors("400", "Tweet not exist");
  }

  const tweet = await Like.findOne({ likedBy: req.user._id, tweet: tweetId });

  if (!tweet) {
    try {
      await Like.create({
        likedBy: req.user._id,
        tweet: tweetId,
      });

      return res.status(200).json(new ApiResponse(200, "liked", "liked added"));
    } catch (error) {
      throw new ApiErrors(500, "something went wrong when adding your like");
    }
  } else {
    try {
      await Like.findByIdAndDelete(tweet._id);

      return res
        .status(200)
        .json(new ApiResponse(200, "unliked", "like removed"));
    } catch (error) {
      throw new ApiErrors(
        500,
        "something went wrong when removing your like from tweet"
      );
    }
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  // const likedVideos = await Like.aggregate([
  //     {
  //         $match:{
  //             likedBy:new mongoose.Types.ObjectId(req.user._id)
  //         }
  //     },
  //     {
  //         $lookup:{
  //             from:"videos",
  //             localField:"video",
  //             foreignField:"_id",
  //             as:"video",
  //             pipeline:[
  //                 {
  //                     $lookup:{
  //                         from:"users",
  //                         localField:"owner",
  //                         foreignField:"_id",
  //                         as:"owner"
  //                     }
  //                 },
  //                 {
  //                     $project:{
  //                         fullName:1,
  //                         userName:1,
  //                         avatar:1
  //                     }
  //                 },
  //                 {
  //                     $addFields:{
  //                         owner:{
  //                             $first:"$owner"
  //                         }
  //                     }
  //                 }
  //             ]
  //         }
  //     },
  //     {
  //         $addFields:{
  //             $first:"$video"
  //         }
  //     }
  // ])

  const likedVideos = await Like.aggregate([
    {
      $match: { likedBy: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $unwind: "$video",
    },
    {
      $lookup: {
        from: "users",
        localField: "video.owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $project: {
        titel: "$video.title",
        thumbnail: "$video.thumbnail",
        videoFile: "$video.videoFile",
        description: "$video.description",
        duration: "$video.duration",
        views: "$video.views",
        owner: {
          fullName: "$owner.fullName",
          userName: "$owner.userName",
          avatar: "$owner.avatar",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
