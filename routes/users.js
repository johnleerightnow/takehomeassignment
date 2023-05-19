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
  updateZoneObjById,
  createCleaningPlanCommand,
  updateCleaningPlan,
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
 *           example: "plan123A"
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
 *                   example: "plan123A"
 */

router.post("/cleaningPlanById", async (req, res) => {
  if (typeof req.body.id !== "string") {
    res.status(400).json("Type is not string");
  }
  const results = await getCleaningPlanById(req.body.id);
  console.log(results);
  res.json(results);
});

/**
 * @swagger
 * components:
 *   schemas:
 *     getFavCleanObjCond:
 *       type: object
 *       required:
 *         - object
 *       properties:
 *         params:
 *           type: object
 *           example: {"default": false,"cleaning_round": 2,"centre_brush_type": "normal"}
 */

/**
 * @swagger
 * /getFavCleanObjCond:
 *   post:
 *     tags:
 *        - Api 3 - Get favourite cleaning object with condition
 *     summary:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/getFavCleanObjCond'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 params:
 *                   type: object
 *                   example: {"default": false,"cleaning_round": 2,"centre_brush_type": "normal"}
 */

/* Api 3 - get favourite cleaning object with condition 
get the cleaning favorite object in which "default":"false", "cleaning_round":2, 
"centre_bursh":{ "type" : "normal"}*/

router.post("/getFavCleanObjCond", async (req, res) => {
  const params = req.body.params;
  const results = await getFavCleanObjCond(params);
  res.status(200).send(results);
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
 *         name: file
 *         type: file
 *         format: binary
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

/**
 * @swagger
 * paths:
 *  /updateCleaningPlan:
 *    put:
 *      tags:
 *        - Api 5 - update cleaning plan with image
 *      consumes:
 *        - multipart/form-data
 *      parameters:
 *        - name: file
 *          in: formdata
 *          type: file
 */

/* Api 5 - update cleaning plan to the database - if the map image is edited, 
it will be overwritten with the new one */

router.put("/updateCleaningPlan", multipartMiddleware, async (req, res) => {
  const planid = req.body;

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

  updateCleaningPlan(planid);

  res.status(200).send("Cleaning plan updated");
});

/* Api 6 - update cleaning zone object */

/**
 * @swagger
 * components:
 *   schemas:
 *     updateZoneObj:
 *       type: object
 *       properties: {}
 *       example: {"id":"zone123A","name":"zone a","order":1,"position":[1.4183,2.25],"cleaning_round":1,"cleaning_duration":"00:25:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"},"side_brush":{"switch":true}}}
 */

/**
 * @swagger
 * /updateZoneObj:
 *   patch:
 *     tags:
 *        - Api 6 - update cleaning zone object by id
 *     summary:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/updateZoneObj'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: {}
 *               example: ""
 */

router.patch("/updateZoneObj", async (req, res) => {
  const zoneObj = req.body;
  updateZoneObjById(zoneObj);
  res.status(200).send("Zone Obj updated");
});

/**
 * @swagger
 * components:
 *   schemas:
 *     createCleaningPlanCommand:
 *       type: object
 *       properties: {}
 *       example: {"cleaning_plan_E":{"id":"plan123E","name":"cleaning plan e","cleaning_favorite":[{"id":"cravin552020","name":"Cravin","default":true,"map":{"id":"map123E","name":"map2.png","path":"/home/images/maps","starting_point":[1,2.185],"clean_zones":[{"id":"zone123A","name":"zone a","order":1,"position":[1.3583,2.15],"cleaning_round":1,"cleaning_duration":"00:30:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"},"side_brush":{"switch":true}}},{"id":"zone123B","name":"zone b","order":2,"position":[1.7096,-1.3494],"cleaning_round":2,"cleaning_duration":"00:30:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"},"side_brush":{"switch":true}}},{"id":"zone123C","name":"zone c","order":3,"position":[33.306,-0.27],"cleaning_round":2,"cleaning_duration":"00:30:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"}}},{"id":"zone123D","name":"zone d","order":4,"position":[32.92,3.05],"cleaning_round":2,"cleaning_duration":"00:30:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"},"side_brush":{"switch":true}}}],"no_go_zones":[{"id":"ngza","position":[1.83,2.5]},{"id":"ngzb","position":[1.56,-1.394]},{"id":"ngzc","position":[32.92,3.05]}],"no_clean_zones":[{"id":"ncz1","position":[30,-0]},{"id":"ncz2","position":[33,3]}]},"cleaningMapId":"plan123E"},{"id":"risjjk1152022","name":"RISJJK","default":false,"map":{"id":"map123Ba","name":"map2.png","path":"/home/images/maps","starting_point":[1,2.185],"clean_zones":[{"id":"zone123EE","name":"zone ee","order":1,"position":[1.3583,2.15],"cleaning_round":1,"cleaning_duration":"00:30:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"},"side_brush":{"switch":true}}},{"id":"zone123EE","name":"zone ee","order":2,"position":[1.7096,-1.3494],"cleaning_round":2,"cleaning_duration":"00:30:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"},"side_brush":{"switch":true}}},{"id":"zone123EE","name":"zone ee","order":-1,"position":[33.306,-0.27],"cleaning_round":2,"cleaning_duration":"00:30:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"}}},{"id":"zone123EE","name":"zone ee","order":-2,"position":[32.92,3.05],"cleaning_round":2,"cleaning_duration":"00:30:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"},"side_brush":{"switch":true}}}],"no_go_zones":[{"id":"ngzee","position":[1.83,2.5]},{"id":"ngzbe","position":[1.56,-1.394]},{"id":"ngzce","position":[32.92,3.05]}],"no_clean_zones":[{"id":"ncz1e","position":[30,-0]},{"id":"ncz2e","position":[33,3]}]},"cleaningMapId":"plan123E"},{"id":"arisa1152022","name":"Arisa","default":false,"map":{"id":"map123CC","name":"map3.png","path":"/home/images/maps","starting_point":[1,2.185],"clean_zones":[{"id":"zone123Aa","name":"zone aa","order":1,"position":[1.3583,2.15],"cleaning_round":1,"cleaning_duration":"00:30:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"},"side_brush":{"switch":true}}},{"id":"zone123Ba","name":"zone ba","order":2,"position":[1.7096,-1.3494],"cleaning_round":2,"cleaning_duration":"00:30:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"},"side_brush":{"switch":true}}},{"id":"zone123EEE","name":"zone eee","order":-1,"position":[33.306,-0.27],"cleaning_round":2,"cleaning_duration":"00:30:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"}}},{"id":"zone123EE","name":"zone eee","order":-2,"position":[32.92,3.05],"cleaning_round":2,"cleaning_duration":"00:30:00","cleaning_preset":{"robot_movement":"slow","vacuum":{"switch":true,"speed":"eco"},"centre_brush":{"switch":true,"type":"normal"},"side_brush":{"switch":true}}}],"no_go_zones":[{"id":"ngzee","position":[1.83,2.5]},{"id":"ngzee","position":[1.56,-1.394]},{"id":"ngzce","position":[32.92,3.05]}],"no_clean_zones":[{"id":"ncz1e","position":[30,-0]},{"id":"ncz2e","position":[33,3]}]},"cleaningMapId":"plan123E"}]}}
 */

/**
 * @swagger
 * /createCleaningPlanCommand:
 *   post:
 *     tags:
 *        - Api 7 - Create cleaning plan command and logs
 *     summary:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/createCleaningPlanCommand'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: {}
 *               example: ""
 */

/* Api 7 - Create cleaning plan command object in database (according to number 5) */

router.post("/createCleaningPlanCommand", (req, res) => {
  const data = req.body;
  createCleaningPlanCommand(data);
  res.status(200).send("Cleaning plan command created and logged");
});

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
 *            example: "plan123D"
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
 *                   example: "plan123D"
 */

/* Api 8 - Delete cleaning plan, map object */
router.delete("/deletePlanAndMapObj", (req, res) => {
  deletePlanAndMapObj(req.body.id);
  res.send("data deleted");
});

/* Initial Routes */

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
