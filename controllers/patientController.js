import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createPatient(req, res) {
  try {
    const { name, email, phone } = req.body;

    const patient = await prisma.patient.create({
      data: {
        name,
        email,
        phone,
      },
    });

    res.status(201).json(patient);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      error: "Could not create patient",
    });
  }
}

export async function getPatients(req, res) {
  try {
    const patients = await prisma.patient.findMany();

    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not fetch patients",
    });
  }
}