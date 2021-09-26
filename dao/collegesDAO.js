let colleges;
let CollectionNames = {
  db0: "colleges",
  db1: "colleges1",
};
let collectionName = CollectionNames["db0"];

export default class CollegesDAO {
  static async injectDB(conn) {
    if (colleges) {
      return;
    }
    try {
      colleges = await conn.db(process.env.DB_NS).collection(collectionName);
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in collegesDAO: ${e}`
      );
    }
  }

  static async getColleges({
    filters = null,
    skip = 0,
    collegesPerPage = 20,
  } = {}) {
    let query;
    if (filters) {
      query = {};
      if ("state" in filters) {
        query["state"] = { $eq: filters["state"] };
      }
      if ("city" in filters) {
        query["city"] = { $eq: filters["city"] };
      }
      if ("course" in filters) {
        if (collectionName === CollectionNames["db0"]) {
          query["courses"] = filters["course"];
        } else if (collectionName === CollectionNames["db1"]) {
          query["course"] = { $eq: filters["course"] };
        }
      } else if (
        "courses" in filters &&
        (filters["courses"]?.length ?? 0) > 0
      ) {
        if (collectionName === CollectionNames["db0"]) {
          query["courses"] = { $in: filters["courses"] };
        } else if (collectionName === CollectionNames["db1"]) {
          query["course"] = { $in: filters["courses"] };
        }
      }
      if ("minStudents" in filters) {
        query["no_of_student"] = { $gte: filters["minStudents"] };
      }
      if ("maxStudents" in filters) {
        query["no_of_student"] = {
          ...query["no_of_student"],
          $lte: filters["maxStudents"],
        };
      }

      if (Object.keys(query).length == 0) query = undefined;
    }

    let cursor;

    try {
      cursor = await colleges.find(query);
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { collegesList: [], totalCount: 0 };
    }

    const displayCursor = cursor.limit(collegesPerPage).skip(skip);

    try {
      const collegesList = await displayCursor.toArray();
      const totalCount = await colleges.countDocuments(query);

      return { collegesList, totalCount };
    } catch (e) {
      console.error(
        `Unable to convert cursor to array or problem counting documents, ${e}`
      );
      return { collegesList: [], totalCount: 0 };
    }
  }

  static async getStats() {
    try {
      let pipeline;
      const stats = {};
      let res;

      pipeline = [{ $group: { _id: "$state", total: { $sum: 1 } } }];
      res = await colleges.aggregate(pipeline);
      stats["states"] = await res.toArray();

      pipeline = [{ $group: { _id: "$city", total: { $sum: 1 } } }];
      res = await colleges.aggregate(pipeline);
      stats["cities"] = await res.toArray();

      if (collectionName === CollectionNames["db0"]) {
        pipeline = [
          { $unwind: "$courses" },
          { $group: { _id: "$courses", total: { $sum: 1 } } },
        ];
      }
      if (collectionName === CollectionNames["db1"]) {
        pipeline = [{ $group: { _id: "$course", total: { $sum: 1 } } }];
      }
      res = await colleges.aggregate(pipeline);
      stats["courses"] = await res.toArray();

      return stats;
    } catch (e) {
      console.error(`Something went wrong in getRestaurantByID: ${e}`);
      throw e;
    }
  }

  static async getCollegeByID(id, withStudents = false) {
    try {
      let pipeline = [];
      pipeline.push({
        $match: {
          id: parseInt(id, 10),
        },
      });
      if (withStudents) {
        pipeline.push({
          $lookup: {
            from: "students",
            let: {
              id: "$id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$college_Id", "$$id"],
                  },
                },
              },
              {
                $sort: {
                  Id: 1,
                },
              },
            ],
            as: "students",
          },
        });
        pipeline.push({
          $addFields: {
            students: "$students",
          },
        });
      }
      return await colleges.aggregate(pipeline).next();
    } catch (e) {
      console.error(`Something went wrong in getCollegeByID: ${e}`);
      throw e;
    }
  }

  static async getCourses() {
    let courses = [];
    try {
      courses = await colleges.distinct("courses");
      return courses;
    } catch (e) {
      console.error(`Unable to get courses ${e}`);
      return courses;
    }
  }

  static async getStates() {
    let states = [];
    try {
      states = await colleges.distinct("state");
      return states;
    } catch (e) {
      console.error(`Unable to get states ${e}`);
      return states;
    }
  }

  static async getCities({ state = null }) {
    let cities = [];
    try {
      let res;
      if (!state) {
        res = await colleges.distinct("city");
        cities = res.map((city) => ({ _id: city }));
      } else {
        let pipeline = [
          {
            $match: {
              state: state,
            },
          },
          { $group: { _id: "$city" } },
        ];
        res = await colleges.aggregate(pipeline);
        cities = res.toArray();
      }
      return cities;
    } catch (e) {
      console.error(`Unable to get cities ${e}`);
      return cities;
    }
  }
}
