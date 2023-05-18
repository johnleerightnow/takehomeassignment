const express = require("express");
const router = express.Router();
const favourite = require("../models/favourite");
const zone = require("../models/zones");
const fs = require("fs");
const currentDirectory = process.cwd();
const {
  getCollectionResults,
  deletePlanAndMapObj,
  getCleaningPlanById,
  getFavCleanObjCond,
  createNewCleaningPlan,
} = require("../Utility/utility.js");
var multipart = require("connect-multiparty");
var multipartMiddleware = multipart();

/* Api 1 - Get all cleaning plans */

/**
 * @swagger
 * /allCleaningPlans:
 *   get:
 *     tags:
 *       - Api 1 - Get all Cleaning Plans
 *     description: Returns all cleaning plans
 *     responses:
 *       200:
 *         description: Success
 *
 */
router.get("/allCleaningPlans", async (req, res) => {
  const results = await getCollectionResults();
  console.log(results);
  res.json(results);
});

/* Api 2 - get cleaning plans by id */

/**
 * @swagger
 * components:
 *   schemas:
 *     CleaningPlanById:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           description: "plan123A"
 */

/**
 * @swagger
 * /cleaningPlanById:
 *   post:
 *     tags:
 *        - Api 2 - Get cleaning plans by id
 *     summary:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CleaningPlanById'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID
 */
router.post("/cleaningPlanById", async (req, res) => {
  const results = await getCleaningPlanById(req.body.id);
  console.log(results);
  res.json(results);
});

/* Api 3 - get favourite cleaning object with condition 
get the cleaning favorite object in which "default":"false", "cleaning_round":2, 
"centre_bursh":{ "type" : "normal"}*/

router.post("/getFavCleanObjCond", async (req, res) => {
  const params = req.body.params;
  const results = getFavCleanObjCond(params);
  res.json(results);
});

/* Api 4 - create new cleaning plan to the database - save the map image in 
local storage(/home/images/maps) and the rest to the database  */

/**
 * @swagger
 * /createNewCleaningPlan:
 *   post:
 *     tags:
 *        - Api 4 - Create new cleaning plan
 *     summary: api working but have not figured out how to upload on swagger
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         description: The image file to upload
 *     responses:
 *       200:
 *         description: Successful image upload
 */

router.post("/createNewCleaningPlan", multipartMiddleware, async (req, res) => {
  // Get the uploaded file
  const file = req.files["file\n"];
  // Specify the destination path to save the file
  const filename = file.name;
  const filePath = `${currentDirectory}/home/images/maps/` + filename;

  // Move the file to the destination path
  fs.rename(file.path, filePath, (err) => {
    if (err) {
      console.error("Error saving file:", err);
      // Handle the error appropriately
      return;
    }

    console.log("File saved successfully.");
  });
  // console.log("Form fields:", req.body);
  // save json file to database
  createNewCleaningPlan(req.body);
  res.json("cleaning plan created and image saved");
});

/* Api 5 - update cleaning plan to the database - if the map image is edited, 
it will be overwritten with the new one */

router.post("/updateCleaningPlan", async (req, res) => {});

/* Api 6 - update the zone object to the database */

router.post("/updateZoneObj", async (req, res) => {});
/* Api 7 - Create cleaning plan command object in database (according to number 5) */

/**
 * @swagger
 * components:
 *   schemas:
 *     deletePlanAndMapObj:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *            type: string
 *            description: "plan123D"
 */

/**
 * @swagger
 * /deletePlanAndMapObj:
 *   delete:
 *     tags:
 *        - Api 8 - Delete plan and map object by id
 *     summary:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/deletePlanAndMapObj'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: "plan123D"
 */

/* Api 8 - Delete cleaning plan, map object */
router.delete("/deletePlanAndMapObj", (req, res) => {
  deletePlanAndMapObj(req.body.id);
  res.send("data deleted");
});

/* Initial Routes */

router.post("/updateZoneObj", async (req, res) => {
  let params = req.body;
  await zone.updateOne(
    {
      _id: params._id,
    },
    {
      $set: params.updateObj,
    }
  );
  res.send({
    message: "success",
  });
});

router.post("/getCleaningFavBasedOnCond", async (req, res) => {
  const zoneObj = await zone.find({
    cleaning_round: req.body.cleaning_round,
    "cleaning_preset.centre_brush.type": req.body.centre_brush_type,
  });
  console.log(zoneObj);
  const cleanFav = await favourite.find({
    default: req.body.favouriteDefault,
    "map.clean_zones": {
      $in: zoneObj.map((x) => x._id.toString()),
    },
  });
  res.send(cleanFav);
});

router.post("/saveZones", async (req, res) => {
  let params = req.body;
  const zoneObj = new zone({
    name: params.name,
    order: params.order,
    position: params.position,
    cleaning_duration: params.cleaning_duration,
    cleaning_preset: params.cleaning_preset,
    cleaning_round: params.cleaning_round,
  });
  await zoneObj.save();
  res.send({ message: "success" });
});

router.post("/saveCleaningFavourite", async (req, res) => {
  const cleanFav = new favourite({
    name: req.body.name,
    default: req.body.default,
    map: req.body.map,
  });
  await cleanFav.save();
  res.json({
    message: "success",
  });
});

module.exports = router;
