import User from "../model/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Team from "../model/team.model.js";
import jwt from "jsonwebtoken";
import csv from "csvtojson";
import fs from "fs";
import Judge from "../model/judges.model.js";
import Marks from "../model/marks.model.js";
import PS from "../model/ps.model.js";
import bcrypt from "bcryptjs";
import { redisKeys } from "../utils/redisKeys.js";
import { REDIS_KEYS } from "../utils/redisConstants.js";
const addUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, workplace } = req.body;
  if (role == "superAdmin") {
    throw new ApiError(400, "You are not allowed to create super admin");
  }
  const user = await User.create({
    name,
    email,
    password,
    role,
    workplace,
    editedBy: req.user._id,
  });
  if (!user) {
    throw new ApiError(400, "User not created");
  }
  await Promise.all([
    redisKeys.clearCache(`${REDIS_KEYS.USER.LIST}:*`),
    redisKeys.clearCache(`${REDIS_KEYS.TEAM}:*`),
    redisKeys.clearCache(`${REDIS_KEYS.JUDGE.LIST}:*`),
    redisKeys.clearCache(`${REDIS_KEYS.JUDGE.ASSIGNED}:*`),
  ])
  res.status(201).json(new ApiResponse(201, user));
});

const bulkAddUser = asyncHandler(async (req, res) => {
  var army = [];
  csv()
    .fromFile(req.file.path)
    .then(async(jsonObj) => {
      for (var i = 0; i < jsonObj.length; i++) {
        var obj = {};
        obj.name = jsonObj[i].name;
        obj.email = jsonObj[i].email;
        obj.password = jsonObj[i].password;
        obj.role = jsonObj[i].role;
        obj.workplace = jsonObj[i].workplace;
        army.push(obj);
      }
      const armyWithEdits = await Promise.all(army.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return {
            ...user,
            password: hashedPassword,
            editedBy: req.user._id,
        };
    }));
    await Promise.all([
      redisKeys.clearCache(`${REDIS_KEYS.USER.LIST}:*`),
      redisKeys.clearCache(`${REDIS_KEYS.TEAM}:*`),
      redisKeys.clearCache(`${REDIS_KEYS.JUDGE.LIST}:*`),
      redisKeys.clearCache(`${REDIS_KEYS.JUDGE.ASSIGNED}:*`),
    ])
      const user = User.insertMany(armyWithEdits)
        .then(() => {
          fs.unlinkSync(req.file.path);
          return res
            .status(201)
            .json(new ApiResponse(201, user, "Users added successfully"));
        })
        .catch((err) => {
          return res.status(400).json({ message: err.message });
        });
    })
    .catch((err) => {
      return res.status(400).json({ message: err.message });
    });
});

const addTeam = asyncHandler(async (req, res) => {
  const { teamName, teamLead, teamMembers } = req.body;
  const team = await Team.create({
    teamName,
    teamLead,
    teamMembers,
    editedBy: req.user._id,
  });
  if (!team) {
    throw new ApiError(400, "Team not created");
  }
  await Promise.all([
    redisKeys.clearCache(`${REDIS_KEYS.USER.LIST}:*`),
    redisKeys.clearCache(`${REDIS_KEYS.TEAM}:*`),
    redisKeys.clearCache(`${REDIS_KEYS.JUDGE.ASSIGNED}:*`),
  ])
  res.status(201).json(new ApiResponse(201, team));
});

const getTeams = asyncHandler(async (req, res) => {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "teamMembers",
        foreignField: "_id",
        as: "teamMembers",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "editedBy",
        foreignField: "_id",
        as: "editedBy",
      },
    },
    {
      $unwind: "$editedBy",
    },
    {
      $project: {
        teamName: 1,
        teamLead: 1,
        teamMembers: {
          name: 1,
          email: 1,
          workplace: 1,
        },
        editedBy: {
          name: 1,
          email: 1,
          role: 1,
        },
      },
    },
  ]);
  if (!teams) {
    throw new ApiError(404, "No teams found");
  }
  res.status(200).json(new ApiResponse(200, teams));
});

const checkInbyEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOneAndUpdate(
    { email },
    { checkIn: true, editedBy: req.user._id },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  await Promise.all([
    redisKeys.clearCache(`${REDIS_KEYS.USER.LIST}:*`),
    redisKeys.clearCache(`${REDIS_KEYS.TEAM}:*`),
    redisKeys.clearCache(`${REDIS_KEYS.JUDGE.ASSIGNED}:*`),
  ])
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User checked in successfully"));
});

const bulkCheckIn = asyncHandler(async (req, res) => {
  const ids = req.body.ids;

  const users = await User.updateMany({ _id: { $in: ids } }, { checkIn: true });

  if (!users) {
    throw new ApiError(404, "Users not found");
  }

  res.status(200).json(new ApiResponse(200, users));
});

const checkInByQr = asyncHandler(async (req, res) => {
  const { qrData } = req.body;

  const user = await User.findOneAndUpdate(
    { _id: qrData },
    { checkIn: true, editedBy: req.user._id },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  await Promise.all([
    redisKeys.clearCache(`${REDIS_KEYS.USER.LIST}:*`),
    redisKeys.clearCache(`${REDIS_KEYS.TEAM}:*`),
    redisKeys.clearCache(`${REDIS_KEYS.JUDGE.ASSIGNED}:*`),
  ])
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User checked in successfully"));
});
const foodQr = asyncHandler(async (req, res) => {
  
  try {
      const { qrData } = req.body;
      console.log(qrData);
      if (!qrData || !qrData._id || !qrData.food) {
          throw new ApiError(400, "Invalid QR data");
      }

      // Find the user first
      const user = await User.findById(qrData._id);
      if (!user) {
          throw new ApiError(404, "User not found");
      }

      // Update the food field correctly
      user.food = { 
          ...user.food, 
          [qrData.foodName]: 1 
      };

      await user.save(); // Save the updated user

      return res.status(200).json(new ApiResponse(200, user, "Food added successfully"));
  } catch (error) {
      console.error("Error in foodQr:", error);
      return res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
  }
});

const handleScanSuccess = async (decodedText) => {
  

  setLoading(true);
  setSuccess('');
  setError('');
  setIsScanning(false);

  try {
      // Check if the decoded text is in JSON format
      let qrData;
      console.log("Decoded QR Data:", decodedData);

      try {
          qrData = JSON.parse(decodedText); // Convert if JSON
      } catch (err) {
          throw new Error(`Invalid QR code format: ${decodedText}`); // Show actual scanned value
      }

      if (!qrData._id || !qrData.foodName) {
          throw new Error("Missing _id or foodName in QR code");
      }

      const response = await adminService.foodQR(qrData);
      setSuccess(response.message || 'Meal confirmed successfully!');
  } catch (error) {
      setError(error.message || 'Failed to confirm meal');
  } finally {
      setLoading(false);
  }
};

const getParticipants = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "participant" }).select(
    "name email workplace food"
  );

  if (!users) {
    throw new ApiError(404, "No participants found");
  }

  res.status(200).json(new ApiResponse(200, users));
});

const getCheckedInUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ checkIn: true }).select(
    "name email workplace food"
  );

  if (!users) {
    throw new ApiError(404, "No users found");
  }

  res.status(200).json(new ApiResponse(200, users));
});

const assignTeamsJudge = asyncHandler(async (req, res) => {
  const { judgeId, teamId } = req.body;

  const judge = await Judge.findByIdAndUpdate(
    judgeId,
    { $push: { teamAssgined: teamId }, editedBy: req.user._id },
    { new: true }
  );

  if (!judge) {
    const judge = await Judge.create({
      judge: judgeId,
      teamAssgined: [teamId],
      editedBy: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, judge));
  }

  return res.status(200).json(new ApiResponse(200, judge));
});

const leaderBoard = asyncHandler(async (req, res) => {
  const marks = await Marks.aggregate([
    {
      $lookup: {
        from: "teams",
        localField: "team",
        foreignField: "_id",
        as: "team",
      },
    },
    {
      $unwind: "$team",
    },
    {
      $lookup: {
        from: "users",
        localField: "judge",
        foreignField: "_id",
        as: "judge",
      },
    },
    {
      $unwind: "$judge",
    },
    {
      $project: {
        _id: 0,
        teamName: "$team.teamName",
        judgeName: "$judge.name",
        innovation: 1,
        presentation: 1,
        feasibility: 1,
        teamwork: 1,
        total: 1,
      },
    },
  ]);

  if (!marks) {
    throw new ApiError(404, "No marks found");
  }

  res.status(200).json(new ApiResponse(200, marks));
});

const addPS = asyncHandler(async (req, res) => {
  const { title, description, domain } = req.body;

  const ps = await PS.create({
    title,
    description,
    domain,
    editedBy: req.user._id,
  });

  if (!ps) {
    throw new ApiError(400, "PS not created");
  }
  await Promise.all([
    redisKeys.clearCache(`${REDIS_KEYS.PS}:*`),
  ])
  return res.status(201).json(new ApiResponse(201, ps));
});

const getPS=asyncHandler(async(req,res)=>{
  const ps=await PS.find({})
  if(!ps){
    throw new ApiError(404,"No PS found")
  }
  return res.status(200).json(new ApiResponse(200,ps))
})

const getNotCheckedInParticipants=asyncHandler(async(req,res)=>{
  const users=await User.find({role:"participant",checkIn:false}).select("name email workplace")
  if(!users){
    throw new ApiError(404,"No participants found")
  }
  return res.status(200).json(new ApiResponse(200,users))
})


export {
  addUser,
  addTeam,
  bulkAddUser,
  getTeams,
  checkInbyEmail,
  bulkCheckIn,
  checkInByQr,
  foodQr,
  getParticipants,
  assignTeamsJudge,
  leaderBoard,
  addPS,
  getCheckedInUsers,
  getNotCheckedInParticipants,
  getPS
};
