const { MongoClient } = require("mongodb");
const fs = require("fs");
const currentDirectory = process.cwd();
const util = require("util");
const readFileAsync = util.promisify(fs.readFile);

async function getCollectionResults() {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}.mongodb.net/test?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("thassignment");
    const collection = database.collection("Cleaning Plan Command");

    const results = await collection
      .aggregate([
        {
          $lookup: {
            from: "Cleaning Plan",
            localField: "id",
            foreignField: "cleaningMapId",
            as: "cleaning_favorite",
          },
        },
      ])
      .toArray();

    return results;
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

async function deletePlanAndMapObj(planId) {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}.mongodb.net/test?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("thassignment");
    const CPCcollection = database.collection("Cleaning Plan Command");
    const CPcollection = database.collection("Cleaning Plan");

    const CPCresults = await CPCcollection.deleteOne({ id: planId });
    const CPresults = await CPcollection.deleteMany({
      cleaningMapId: planId,
    });
    console.log(CPCresults, CPresults);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

async function getCleaningPlanById(cleaningMapId) {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}.mongodb.net/test?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);

  try {
    let finalresult;
    await client.connect();
    const database = client.db("thassignment");
    const CPCcollection = database.collection("Cleaning Plan Command");

    const results = await CPCcollection.aggregate([
      {
        $match: {
          id: cleaningMapId,
        },
      },
      {
        $lookup: {
          from: "Cleaning Plan",
          localField: "id",
          foreignField: "cleaningMapId",
          as: "cleaning_favorite",
        },
      },
      {
        $unwind: "$cleaning_favorite",
      },
      {
        $match: {
          "cleaning_favorite.default": true,
        },
      },
    ]).toArray();
    finalresult = results[0].cleaning_favorite.map;
    const mapname = results[0].cleaning_favorite.map.name;
    const imagepath = results[0].cleaning_favorite.map.path + "/" + mapname;

    async function readfile() {
      const readfile = await readFileAsync(`${currentDirectory}${imagepath}`);
      // Convert the binary image data to Base64
      const base64Image = readfile.toString("base64");

      // Create a JSON object with the Base64-encoded image
      // const imageObject = {
      //   name: `${mapname}`,
      //   data: base64Image,
      // };
      const jsonimage = base64Image;

      finalresult["jsonimage"] = jsonimage;
    }
    await readfile();

    return finalresult;
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

async function getFavCleanObjCond(params) {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}.mongodb.net/test?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("thassignment");
    const CPcollection = database.collection("Cleaning Plan");

    const results = await CPcollection.find({
      default: params.default,
      "map.clean_zones.cleaning_round": params.cleaning_round,
      "map.clean_zones.cleaning_preset.centre_brush.type":
        params.centre_brush_type,
    }).toArray();

    console.log(results);

    return results;
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

async function createNewCleaningPlan(cleaningObj) {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}.mongodb.net/test?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("thassignment");
    const CPCcollection = database.collection("Cleaning Plan Command");
    const CPcollection = database.collection("Cleaning Plan");

    const cpcdata = cleaningObj.data;

    sourceObject = Object.values(JSON.parse(cpcdata))[0];
    // console.log("sourceObject", sourceObject);
    const { cleaning_favorite, ...cpcdatainsert } = sourceObject;
    // console.log("cpcdatainsert", cpcdatainsert);
    await CPCcollection.insertOne(cpcdatainsert);
    await CPcollection.insertMany(sourceObject.cleaning_favorite);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

async function createCleaningPlanCommand(sourceObj) {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}.mongodb.net/test?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);

  const { cleaning_favorite, ...cpcObj } = Object.values(sourceObj)[0];
  console.log(cpcObj);

  try {
    await client.connect();
    const database = client.db("thassignment");
    const CPCcollection = database.collection("Cleaning Plan Command");
    await CPCcollection.insertOne(cpcObj);
    const starttime =
      new Date().toLocaleDateString() + " : " + new Date().toLocaleTimeString();
    const logtext = cleaning_favorite.map((obj) => {
      return {
        name: obj.name,
        order: obj.map.clean_zones.sort((a, b) => a.order - b.order),
        parameters: obj.map.clean_zones.map(
          (ele) =>
            ele.name +
            " = Vacuum Speed " +
            ele.cleaning_preset.vacuum.speed +
            ", Centre Brush Type " +
            ele.cleaning_preset.centre_brush.type
        ),
        skippedzones: obj.map.no_go_zones.map((ele) => ele.position),
        startingtime: starttime,
      };
    });
    fs.writeFile(
      `${currentDirectory}/home/images/logs/${new Date()}-log.txt`,
      JSON.stringify(logtext),
      (err) => {
        if (err) throw err;
      }
    );
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

async function updateZoneObjById(cleanzoneObj) {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}.mongodb.net/test?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("thassignment");
    const CPcollection = database.collection("Cleaning Plan");
    const results = await CPcollection.findOne({
      "map.clean_zones.id": cleanzoneObj.id,
    });
    await CPcollection.updateOne(
      { "map.clean_zones.id": cleanzoneObj.id },
      { $set: { "map.clean_zones": cleanzoneObj } }
    );
    console.log(results);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

module.exports = {
  getCollectionResults,
  deletePlanAndMapObj,
  getCleaningPlanById,
  getFavCleanObjCond,
  createNewCleaningPlan,
  updateZoneObjById,
  createCleaningPlanCommand,
};
