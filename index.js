import bcrypt from 'bcrypt';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'MedTask API is running' });
});
app.post('/patients', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const patient = await prisma.patient.create({
      data: { name, email, phone },
    });

    res.status(201).json(patient);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Could not create patient' });
  }
});
app.get('/patients', async (req, res) => {
  try {
    const patients = await prisma.patient.findMany();
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not fetch patients' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.post('/staff/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const staff = await prisma.staff.create({
      data: { name, email, passwordHash, role },
    });

    res.status(201).json({ id: staff.id, name: staff.name, email: staff.email, role: staff.role });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Could not create staff account' });
  }
});