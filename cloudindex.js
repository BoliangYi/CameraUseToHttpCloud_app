const { google } = require('googleapis');
const { Readable } = require('stream');
const busboy = require('busboy');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const SERVICE_ACCOUNT_KEY = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;
const CLIENT_ID = process.env.CLIENT_ID;

const auth = new google.auth.GoogleAuth({
  credentials: SERVICE_ACCOUNT_KEY,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

exports.uploadFile = async (req, res) => {
  if (req.method === 'POST') {
    console.log('Starting file upload process...');
    console.time('FileUploadTime');

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No valid authorization header.');
      return res.status(401).send('Unauthorized');
    }

    const idToken = authHeader.split('Bearer ')[1];
    const client = new OAuth2Client(CLIENT_ID);

    try {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const userId = payload['sub'];
      console.log('User ID:', userId);
    } catch (error) {
      console.error('Authentication failed:', error);
      return res.status(401).send('Unauthorized');
    }

    const bus = busboy({ headers: req.headers });
    let fileData = null;
    let fileName = null;
    let mimeType = null;

    bus.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log('File received:', filename);
      const chunks = [];
      file.on('data', (chunk) => {
        chunks.push(chunk);
      });
      file.on('end', () => {
        fileData = Buffer.concat(chunks);
        fileName = filename;
        mimeType = mimetype;
      });
    });

    bus.on('finish', async () => {
      if (!fileData || !fileName || !mimeType) {
        console.error('No file uploaded.');
        res.status(400).send('No file uploaded.');
        return;
      }

      const fileMetadata = {
        name: fileName,
        parents: [DRIVE_FOLDER_ID],
      };

      const fileStream = Readable.from(fileData);

      try {
        console.log('Uploading file to Google Drive...');
        const response = await drive.files.create({
          resource: fileMetadata,
          media: {
            mimeType: mimeType,
            body: fileStream,
          },
          fields: 'id',
        });

        console.log('File uploaded successfully:', response.data.id);
        res.status(200).json({ fileId: response.data.id });
      } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file.');
      } finally {
        console.timeEnd('FileUploadTime');
      }
    });

    bus.on('error', (err) => {
      console.error('Error parsing request:', err);
      res.status(500).send('Error parsing request.');
    });

    bus.end(req.rawBody);
  } else {
    res.status(404).send('Not found');
  }
};