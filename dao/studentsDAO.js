let students;
let CollectionNames = {
  db0: "students",
  db1: "students1",
};
let collectionName = CollectionNames["db0"];

export default class StudentsDAO {
  static async injectDB(conn) {
    if (students) {
      return;
    }
    try {
      students = await conn.db(process.env.DB_NS).collection(collectionName);
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in studentsDAO: ${e}`
      );
    }
  }

  static async getStudents({
    filters = null,
    page = 0,
    studentsPerPage = 20,
  } = {}) {
    let query;
    if (filters) {
      query = {};
      if ("city" in filters) {
        query["city"] = { $eq: filters["city"] };
      } else if ("state" in filters) {
        query["state"] = { $eq: filters["state"] };
      }
      if ("enrolled_course" in filters) {
        query["enrolled_course"] = { $eq: filters["enrolled_course"] };
      }
      if ("skill" in filters) {
        query["skills"] = filters["skill"];
      } else if ("skills" in filters && (filters["skills"]?.length ?? 0) > 0) {
        query["skills"] = { $in: filters["skills"] };
      }
    }

    let cursor;

    try {
      cursor = await students.find(query);
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { studentsList: [], totalCount: 0 };
    }

    const displayCursor = cursor
      .limit(studentsPerPage)
      .skip(studentsPerPage * page);

    try {
      const studentsList = await displayCursor.toArray();
      const totalCount = await students.countDocuments(query);
      return { studentsList, totalCount };
    } catch (e) {
      console.error(
        `Unable to convert cursor to array or problem counting documents, ${e}`
      );
      return { studentsList: [], totalCount: 0 };
    }
  }

  static async getStudentByID(Id) {
    try {
      const pipeline = [
        {
          $match: {
            id: Id,
          },
        },
        {
          $lookup: {
            from: "colleges",
            let: {
              cid: "$college_Id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$id", "$$cid"],
                  },
                },
              },
              {
                $sort: {
                  id: 1,
                },
              },
            ],
            as: "college",
          },
        },
        {
          $addFields: {
            college: "$college",
          },
        },
      ];
      return await students.aggregate(pipeline).next();
    } catch (e) {
      console.error(`Something went wrong in getStudentByID: ${e}`);
      throw e;
    }
  }

  static async getSkills() {
    let skills = [];
    try {
      skills = await students.distinct("skills");
      return skills;
    } catch (e) {
      console.error(`Unable to get skills ${e}`);
      return skills;
    }
  }
}
