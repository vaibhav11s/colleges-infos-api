import CollegesDAO from "../dao/collegesDAO.js";

const GroupCourses = {
  1: ["AI", "Computer Science", "Machine Learning", "Data Science"],

  2: [
    "Meachanical",
    "Fluid Mechanics",
    "Applied Mechanics",
    "Manufacturing",
    "Physics",
  ],

  3: ["Forensic", "Chemical engineering", "Geochemistry", "Chemicalphysics"],

  4: ["BioChemistry", "MBBD", "B.Pharm", "B.Sc. Nursing", "PHARM D"],
};

const CoursesGroups = {
  AI: 1,
  "Computer Science": 1,
  "Machine Learning": 1,
  "Data Science": 1,

  Meachanical: 2,
  "Fluid Mechanics": 2,
  "Applied Mechanics": 2,
  Manufacturing: 2,
  Physics: 2,

  Forensic: 3,
  "Chemical engineering": 3,
  Geochemistry: 3,
  Chemicalphysics: 3,

  BioChemistry: 4,
  MBBD: 4,
  "B.Pharm": 4,
  "B.Sc. Nursing": 4,
  "PHARM D": 4,
};

const similarCourses = (courses = []) => {
  if (!courses) return [];
  let grpNames = {};
  courses.forEach((course) => {
    grpNames[CoursesGroups[course]] = 1;
  });

  let similars = [];
  Object.keys(grpNames).forEach((grpNam) => {
    let coursesss = GroupCourses[grpNam];
    similars = [...similars, ...coursesss];
  });

  return similars;
};

export default class CollegesController {
  static async apiGetColleges(req, res, next) {
    const collegesPerPage = req.query.collegesPerPage
      ? parseInt(req.query.collegesPerPage, 10)
      : 20;
    const page = req.query.page ? parseInt(req.query.page, 10) : 0;
    const skip = req.query.skip
      ? parseInt(req.query.skip, 10)
      : collegesPerPage * page;
    let filters = {};
    if (req.query.city) {
      filters.city = req.query.city;
    }
    if (req.query.state) {
      filters.state = req.query.state;
    }
    if (req.query.course) {
      filters.course = req.query.course;
    } else if (req.query.courses) {
      filters.courses = req.query.courses.split(",");
    }
    if (req.query.minStudents) {
      filters.minStudents = parseInt(req.query.minStudents, 10);
    }
    if (req.query.maxStudents) {
      filters.maxStudents = parseInt(req.query.maxStudents, 10);
    }

    const { collegesList, totalCount } = await CollegesDAO.getColleges({
      filters,
      skip,
      collegesPerPage,
    });

    let response = {
      Colleges: collegesList,
      page,
      skip,
      filters: filters,
      collegesPerPage: collegesPerPage,
      totalCount: totalCount,
    };
    res.json(response);
  }

  static async apiGetSimilarColleges(req, res, next) {
    try {
      const collegeId = req.params.id;
      let college = await CollegesDAO.getCollegeByID(collegeId, false);
      if (!college) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      let filters = {};
      filters.state = college.State;
      filters.courses = similarCourses(college.courses);
      filters.minStudents = college.no_of_student - 100;
      filters.maxStudents = college.no_of_student + 100;
      const { collegesList, totalCount } = await CollegesDAO.getColleges({
        filters,
        skip: 0,
        collegesPerPage: 100,
      });

      let response = {
        college,
        Colleges: collegesList,
        totalCount,
      };
      res.json(response);
    } catch (e) {
      console.log(`api, ${e}`);
      res.status(500).json({ error: e });
    }
  }

  static async apiGetCollegeById(req, res, next) {
    try {
      let id = req.params.id || {};
      let withStudents = req.query?.students?.toLowerCase() === "true" ?? false;
      let college = await CollegesDAO.getCollegeByID(id, withStudents);
      if (!college) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      if (req.query?.similar?.toLowerCase() === "true") {
        let filters = {};
        filters.state = college.state;
        filters.courses = similarCourses(college.courses);
        filters.minStudents = college.no_of_student - 100;
        filters.maxStudents = college.no_of_student + 100;
        const { collegesList, totalCount } = await CollegesDAO.getColleges({
          filters,
          skip: 0,
          collegesPerPage: 100,
        });
        console.log(filters);
        college["similarColleges"] = collegesList;
      }
      res.json(college);
    } catch (e) {
      console.log(`api, ${e}`);
      res.status(500).json({ error: e });
    }
  }

  static async apiGetStats(req, res, next) {
    try {
      let stats = await CollegesDAO.getStats();
      res.json(stats);
    } catch (e) {
      console.log(`api,${e}`);
      res.status(500).json({ error: e });
    }
  }

  static async apiGetCourses(req, res, next) {
    try {
      let courses = await CollegesDAO.getCourses();
      res.json(courses);
    } catch (e) {
      console.log(`api,${e}`);
      res.status(500).json({ error: e });
    }
  }

  static async apiGetStates(req, res, next) {
    try {
      let states = await CollegesDAO.getStates();
      res.json(states);
    } catch (e) {
      console.log(`api,${e}`);
      res.status(500).json({ error: e });
    }
  }

  static async apiGetCities(req, res, next) {
    try {
      let cities = await CollegesDAO.getCities();
      res.json(cities);
    } catch (e) {
      console.log(`api,${e}`);
      res.status(500).json({ error: e });
    }
  }
}
