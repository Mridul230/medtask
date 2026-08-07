

export const createPatient = asyncHandler(async (req,res)=>{

    const patient = await createPatientService(...);

    res.status(201).json(patient);

});