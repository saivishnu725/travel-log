import express from 'express';
import multer from 'multer';
import bodyParser from 'body-parser';
import path, { dirname } from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 8520;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = `uploads/${req.body.tag}`;
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.array('files'), (req, res) => {
    res.json({ message: 'Files uploaded successfully' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/zip', (req, res) => {
    const tag = req.query.tag;
    const folderPath = tag === '*' ? 'uploads' : path.join('uploads', tag);

    if (!fs.existsSync(folderPath)) {
        return res.status(404).send('Folder not found');
    }

    const zipFilename = tag === '*' ? 'all.zip' : `${tag}.zip`;
    const output = fs.createWriteStream(zipFilename);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    output.on('close', () => {
        res.download(zipFilename, (err) => {
            if (err) {
                console.error('Error downloading zip:', err);
            }
            fs.unlinkSync(zipFilename); // Clean up the file after download
        });
    });

    archive.on('error', (err) => {
        console.error('Archiver error:', err);
        res.status(500).send('Error creating zip');
    });

    archive.pipe(output);

    if (tag === '*') {
        archive.directory('uploads', false);
    } else {
        archive.directory(folderPath, false);
    }

    archive.finalize();
});

// Endpoint to save data
app.post('/save-data', (req, res) => {
    const data = req.body;

    // Read existing data from data.json file, if it exists
    // let existingData = [];
    // if (fs.existsSync('data.json')) {
    //     existingData = JSON.parse(fs.readFileSync('data.json'));
    // }

    // Merge existing data with new data and write back to data.json file
    // const newData = [...existingData, data];
    const newData = data;
    fs.writeFileSync('data.json', JSON.stringify(newData, null, 2));

    res.json({ message: 'Data saved successfully' });
});

// Endpoint to load data
app.get('/retrieve-data', (req, res) => {
    // Check if the data.json file exists
    if (!fs.existsSync('data.json')) {
        return res.status(404).json({ error: 'Data file not found' });
    }

    // Read the data from data.json file
    const data = JSON.parse(fs.readFileSync('data.json'));

    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});