import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiErrors } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiErrors(400, "Provide channel id");
  }

  const channelExist = await User.findById(channelId);

  if (!channelExist) {
    throw new ApiErrors(404, "provided id does not exist");
  }

  const isExist = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (!isExist) {
    try {
      await Subscription.create({
        subscriber: req.user._id,
        channel: channelId,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, "subscribed", "subscription added"));
    } catch (error) {
      throw new ApiErrors(
        500,
        "something went wrong when adding your subscription"
      );
    }
  } else {
    try {
      await Subscription.findByIdAndDelete(isExist._id);

      return res
        .status(200)
        .json(new ApiResponse(200, "subscription removed", "removed"));
    } catch (error) {
      throw new ApiErrors(
        500,
        "something went wrong when removing your subscription"
      );
    }
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiErrors(400, "Provide channel id");
  }

  const channelExist = await User.findById(channelId);

  if (!channelExist) {
    throw new ApiErrors(404, "provided id does not exist");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: channelId },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        subscriber: {
          _id: 1,
          userName: 1,
          fullName: 1,
          avatar: 1,
        },
      },
    },
  ]);

  if (!subscribers.length) {
    throw new ApiErrors(404, "This channel have no subscribers yet");
  }

  const info = {
    subscribers: subscribers || [],
    totalSubscribers: subscribers.length || 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, info, "subscribers fetched successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId || !isValidObjectId(subscriberId)) {
    throw new ApiErrors(400, "provide subscriber id");
  }

  const user = await User.findById(subscriberId);

  if (!user) {
    throw new ApiErrors(404, "subscriber not found");
  }

  const subscribedChannel = await Subscription.aggregate([
    {
      $match: { subscriber: subscriberId },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
      },
    },
    {
      $unwind: "$channel",
    },
    {
      $project: {
        subscriber: {
          _id: 1,
          userName: 1,
          fullName: 1,
          avatar: 1,
        },
      },
    },
  ]);

  if (!subscribedChannel.length) {
    throw new ApiErrors(408, "the user have not subscribed to any channel");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannel,
        "subscribed channel fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
