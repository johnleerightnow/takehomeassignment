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

async function getFavCleanObjCond(cleaningMapId) {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}.mongodb.net/test?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("thassignment");
    const CPCcollection = database.collection("Cleaning Plan Command");
    // const CPcollection = database.collection("Cleaning Plan");

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

module.exports = {
  getCollectionResults,
  deletePlanAndMapObj,
  getCleaningPlanById,
  getFavCleanObjCond,
  createNewCleaningPlan,
};
