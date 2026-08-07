import prisma from "../config/prisma.js";

export async function createPatient(data) {
  return prisma.patient.create({
    data,
  });
}

export async function getPatients() {
  return prisma.patient.findMany();
}