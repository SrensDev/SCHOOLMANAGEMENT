const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const Student = require('./models/student');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('URL', { useNewUrlParser: true, useUnifiedTopology: true });

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'public')));

function checkAuth(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
        req.session.loggedIn = true;
        res.redirect('/dashboard');
    } else {
        res.send('Login failed');
    }
});

app.get('/dashboard', checkAuth, async (req, res) => {
    const { filterDate, sortBy } = req.query;
    let students = await Student.find();

    if (filterDate) {
        const date = new Date(filterDate);
        students = students.filter(student => {
            return student.attendance.some(att => {
                return new Date(att.date).toLocaleDateString() === date.toLocaleDateString();
            });
        });
    }

    if (sortBy === 'name') {
        students.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'class') {
        students.sort((a, b) => a.class.localeCompare(b.class));
    }

    res.render('dashboard', { students });
});

app.get('/add-student', checkAuth, (req, res) => {
    res.render('addStudent', { student: null});
});

app.post('/add-student', checkAuth, async (req, res) => {
    const { name, class: studentClass, attendanceDate } = req.body;
    const student = new Student({
        name,
        class: studentClass,
        attendance: [{ date: new Date(attendanceDate) }]
    });
    await student.save();
    res.redirect('/dashboard');
});

app.post('/delete-student/:id', checkAuth, async (req, res) => {
    await Student.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');
});

app.get('/edit-student/:id', checkAuth, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).send('Siswa tidak ditemukan!');
        }
        res.render('editStudent', { student });
    } catch (error) {
        console.error(error);
        res.status(500).send('Terjadi kesalahan saat mengambil data siswa!');
    }
});

app.post('/edit-student/:id', checkAuth, async (req, res) => {
    const { name, class: studentClass, attendanceDate } = req.body;
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).send('Siswa tidak ditemukan!');
        }
        student.name = name;
        student.class = studentClass;
        student.attendance = [{ date: new Date(attendanceDate) }];
        await student.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Terjadi kesalahan saat memperbarui data siswa!');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});