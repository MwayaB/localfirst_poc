import PocketBase from 'pocketbase';
import express from 'express';
import cors from 'cors';


const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.post('/sync', async (req, res) => {
    const { lastSync, changes } = req.body;

    try {
        const pb = new PocketBase('http://127.0.0.1:8090');
        await pb.collection("_superusers").authWithPassword('test@example.com', '0123456789');

        const syncedPatients = [];
        const syncedVisits = [];

        // --- Sync Patients ---
        for (const patient of changes.patients) {
            const external_id = String(patient.patient_id);
            const {
                given_name,
                family_name,
                birthdateEstimated,
                gender,
                birthdate,
                updated_at,
                created_at
            } = patient;

            const patientData = {
                external_id,
                given_name,
                family_name,
                birthdate_estimated: birthdateEstimated,
                gender,
                birthdate,
                created_at,
                updated_at,
            };

            try {
                const existing = await pb.collection('patients').getFirstListItem(`external_id="${external_id}"`);
                if (new Date(updated_at) > new Date(existing.updated_at)) {
                    const updated = await pb.collection('patients').update(existing.id, patientData);
                    syncedPatients.push(updated);
                } else {
                    syncedPatients.push(existing);
                }
            } catch (err) {
                const created = await pb.collection('patients').create(patientData);
                syncedPatients.push(created);
            }
        }

        // Helper map: external_id (from patient) -> PocketBase patient record ID
        const patientMap = {};
        for (const record of syncedPatients) {
            patientMap[record.external_id] = record.id;
        }

        debugger;

        // --- Sync Visits ---
        for (const visit of changes.visits) {
            const external_id = String(visit.visit_id);
            const {
                patient_id,
                visit_date,
                visit_start_time,
                visit_status,
                visit_step,
                updated_at,
                created_at
            } = visit;

            const combinedDateTime = new Date(`${visit_date}T${visit_start_time}:00Z`).toISOString();

            const visitData = {
                external_id,
                patient: patientMap[String(patient_id)], // FK to PocketBase patient
                visit_date,
                visit_start_time: combinedDateTime,
                visit_status,
                visit_step,
                created_at,
                updated_at,
            };

            try {
                const existing = await pb.collection('visits').getFirstListItem(`external_id="${external_id}"`);
                if (new Date(updated_at) > new Date(existing.updated_at)) {
                    const updated = await pb.collection('visits').update(existing.id, visitData);
                    syncedVisits.push(updated);
                } else {
                    syncedVisits.push(existing);
                }
            } catch (err) {
                const created = await pb.collection('visits').create(visitData);
                syncedVisits.push(created);
            }
        }

        // --- Fetch server-side updates since lastSync ---
        const serverPatients = await pb.collection('patients').getFullList({
            filter: lastSync ? `updated_at > "${lastSync}"` : '',
        });

        const serverVisits = await pb.collection('visits').getFullList({
            filter: lastSync ? `updated_at > "${lastSync}"` : '',
        });

        res.json({
            patients: serverPatients,
            visits: serverVisits,
            serverTime: new Date().toISOString()
        });

    } catch (error) {
        console.error("Sync failed:", error);
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    (async () => {
        try {
            await createCollections();
            console.log(`Express server running on port ${PORT}`);
        } catch (error) {
            console.error('Error creating collections:', error);
        }
    })();
});



async function createCollections() {
    const pb = new PocketBase('http://127.0.0.1:8090');
    await pb.collection("_superusers").authWithPassword('test@example.com', '0123456789');

    const collections = await pb.collections.getList();
    const existingNames = collections.items.map(c => c.name);

    // --- Create 'patients' collection if it doesn't exist ---
    if (!existingNames.includes('patients')) {
        await pb.collections.create({
            name: 'patients',
            type: 'base',
            fields: [
                { name: 'given_name', type: 'text', required: true },
                { name: 'family_name', type: 'text' },
                { name: 'birthdateEstimated', type: 'bool' },
                { name: 'external_id', type: 'text', presentable: true },
                { name: 'gender', type: 'text' },
                { name: 'created_at', type: 'date' },
                { name: 'updated_at', type: 'date' },
            ],
        });
        console.log('Created patients collection.');
    } else {
        console.log('Patients collection already exists.');
    }

    // --- Create 'visits' collection if it doesn't exist ---
    if (!existingNames.includes('visits')) {
        const patientsCollection = await pb.collections.getOne('patients');
        await pb.collections.create({
            name: 'visits',
            type: 'base',
            fields: [
                {
                    name: 'patient',
                    type: 'relation',
                    collectionId: patientsCollection.id,
                    maxSelect: 1
                },
                { name: 'visit_date', type: 'date' },
                { name: 'visit_start_time', type: 'date' },
                { name: 'visit_status', type: 'text' },
                { name: 'visit_step', type: 'text' },
                { name: 'created_at', type: 'date' },
                { name: 'updated_at', type: 'date' },
                { name: 'external_id', type: 'text' },
            ],
        });
        console.log('Created visits collection.');
    } else {
        console.log('Visits collection already exists.');
    }
}
