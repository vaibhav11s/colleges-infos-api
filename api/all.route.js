import express from "express";
import StudentCtrl from "./students.controller.js";
import CollegeCtrl from "./colleges.controller.js";

const router = express.Router();

router.route("/students").get(StudentCtrl.apiGetStudents);
router.route("/students/skills").get(StudentCtrl.apiGetSkills);
router.route("/students/stats").get(StudentCtrl.apiGetStats);
router.route("/students/:id").get(StudentCtrl.apiGetStudentById);
router.route("/colleges").get(CollegeCtrl.apiGetColleges);
router.route("/colleges/courses").get(CollegeCtrl.apiGetCourses);
router.route("/colleges/states").get(CollegeCtrl.apiGetStates);
router.route("/colleges/cities").get(CollegeCtrl.apiGetCities);
router.route("/colleges/stats").get(CollegeCtrl.apiGetStats);
router.route("/colleges/:id").get(CollegeCtrl.apiGetCollegeById);
router.route("/").get(CollegeCtrl.apiGetColleges);

export default router;
