const express = require('express');
const fileUpload = require('express-fileupload');
const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(fileUpload());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'yourusername',
  password: 'yourpassword',
  database: 'file_sharing'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL connected...');
});

// Upload a file
app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let uploadedFile = req.files.file;
  let uploadPath = path.join(__dirname, 'uploads', uploadedFile.name);

  uploadedFile.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    let sql = 'INSERT INTO files (name, path) VALUES (?, ?)';
    let values = [uploadedFile.name, uploadPath];
    db.query(sql, values, (err, result) => {
      if (err) throw err;
      res.send('File uploaded and saved to database.');
    });
  });
});

// List all files
app.get('/files', (req, res) => {
  let sql = 'SELECT * FROM files';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Download a file
app.get('/download/:id', (req, res) => {
  let sql = 'SELECT * FROM files WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) throw err;
    if (result.length === 0) {
      return res.status(404).send('File not found.');
    }
    let filePath = result[0].path;
    res.download(filePath);
  });
});

// Delete a file
app.delete('/delete/:id', (req, res) => {
  let sql = 'SELECT * FROM files WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) throw err;
    if (result.length === 0) {
      return res.status(404).send('File not found.');
    }
    let filePath = result[0].path;
    fs.unlink(filePath, (err) => {
      if (err) throw err;

      let sql = 'DELETE FROM files WHERE id = ?';
      db.query(sql, [req.params.id], (err, result) => {
        if (err) throw err;
        res.send('File deleted.');
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});