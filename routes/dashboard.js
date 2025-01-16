const express = require('express');
const router = express.Router();
const Student = require('../models/student');

router.get('/', async (req, res) => {
    const { filterDate, sortBy } = req.query;
    let students = await Student.find();

    if (filterDate) {
        students = students.filter(student => {
            return student.attendance.some(att => new Date(att.date).toLocaleDateString() === new Date(filterDate).toLocaleDateString());
        });
    }

    if (sortBy === 'name') {
        students.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'class') {
        students.sort((a, b) => a.class.localeCompare(b.class));
    }

    res.render('dashboard', { students });
});

module.exports = router;