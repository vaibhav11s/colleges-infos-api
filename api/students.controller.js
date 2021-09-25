import StudentsDAO from "../dao/studentsDAO.js";

export default class StudentsController {
  static async apiGetStudents(req, res, next) {
    const studentsPerPage = req.query.studentsPerPage
      ? parseInt(req.query.studentsPerPage, 10)
      : 20;
    const page = req.query.page ? parseInt(req.query.page, 10) : 0;

    let filters = {};
    if (req.query.city) {
      filters.city = req.query.city;
    } else if (req.query.state) {
      filters.state = req.query.state;
    }
    if (req.query.college_Id) {
      filters.college_Id = req.query.college_Id;
    }
    if (req.query.enrolled_course) {
      filters.enrolled_course = req.query.enrolled_course;
    }
    if (req.query.skill) {
      filters.skill = req.query.skill;
    } else if (req.query.skills) {
      filters.skills = req.query.skills.split(",");
    }

    const { studentsList, totalCount } = await StudentsDAO.getStudents({
      filters,
      page,
      studentsPerPage,
    });

    let response = {
      Students: studentsList,
      page: page,
      filters: filters,
      studentsPerPage: studentsPerPage,
      totalCount: totalCount,
    };

    res.json(response);
  }

  static async apiGetStudentById(req, res, next) {
    try {
      let id = req.params.id || {};
      let student = await StudentsDAO.getStudentByID(id);
      if (!student) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json(student);
    } catch (e) {
      console.log(`api, ${e}`);
      res.status(500).json({ error: e });
    }
  }

  static async apiGetStats(req, res, next) {
    try {
      let college_Id = req.query.college_Id;
      let stats = await StudentsDAO.getStats({ college_Id });
      res.json(stats);
    } catch (e) {
      console.log(`api,${e}`);
      res.status(500).json({ error: e });
    }
  }

  static async apiGetSkills(req, res, next) {
    try {
      let Skills = await StudentsDAO.getSkills();
      res.json(Skills);
    } catch (e) {
      console.log(`api,${e}`);
      res.status(500).json({ error: e });
    }
  }
}
