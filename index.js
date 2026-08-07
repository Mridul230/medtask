import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import requireAuth from "./middleware/authMiddleware.js";
import patientRoutes from "./routes/patientRoutes.js";

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'MedTask API is running' });
});

app.use("/patients", patientRoutes);
app.post('/departments', async (req, res) => {
  try {
    const { name } = req.body;

    const department = await prisma.department.create({
      data: { name },
    });

    res.status(201).json(department);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Could not create department' });
  }
});
app.post('/appointments', async (req, res) => {
  try {
    const { patientId, departmentId } = req.body;

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        departmentId,
        status: 'REQUESTED',
      },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Could not create appointment' });
  }
});
app.get('/appointments', requireAuth, async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: true,
        department: true,
        doctor: true,
      },
    });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not fetch appointments' });
  }
});
app.patch('/appointments/:id/approve', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId, scheduledDate } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        doctorId,
        scheduledDate: new Date(scheduledDate),
      },
    });

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Could not approve appointment' });
  }
});
app.post('/tasks', requireAuth, async (req, res) => {
  try {
    const { departmentId, appointmentId, title, description, patientReference, priority, assignedToId, dueDate } = req.body;

    const task = await prisma.task.create({
      data: {
        departmentId,
        appointmentId,
        title,
        description,
        patientReference,
        priority,
        assignedToId,
        createdById: req.staff.staffId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Could not create task' });
  }
});
app.get('/tasks', requireAuth, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        department: true,
        appointment: true,
        assignedTo: true,
        createdBy: true,
        comments: true,
      },
    });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not fetch tasks' });
  }
});

app.patch('/tasks/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedToId } = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId && { assignedToId }),
      },
    });

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Could not update task' });
  }
});
app.post('/tasks/:id/comments', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.create({
      data: {
        taskId: parseInt(id),
        staffId: req.staff.staffId,
        content,
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Could not add comment' });
  }
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

app.post('/staff/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const staff = await prisma.staff.findUnique({ where: { email } });
    if (!staff) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, staff.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { staffId: staff.id, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, staff: { id: staff.id, name: staff.name, role: staff.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});
app.get('/staff/me', requireAuth, async (req, res) => {
  const staff = await prisma.staff.findUnique({ where: { id: req.staff.staffId } });
  res.json({ id: staff.id, name: staff.name, email: staff.email, role: staff.role });
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});