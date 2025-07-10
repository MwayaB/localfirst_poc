import PocketBase from 'pocketbase';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

const clients = new Set();

app.get('/sync/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
});

function notifySyncComplete(data) {
  const payload = {
    type: "sync_complete",
    timestamp: new Date().toISOString(),
    data,
  };
  
  const jsonString = JSON.stringify(payload);

  // Fixed: Remove duplicate loop
  for (const client of clients) {
    try {
      client.write(`data: ${jsonString}\n\n`);
    } catch (error) {
      console.error('Error writing to SSE client:', error);
      clients.delete(client);
    }
  }
}

app.post('/sync', async (req, res) => {
  const { changes } = req.body; 

  try {
    const pb = new PocketBase('http://127.0.0.1:8090');
    await pb.collection("_superusers").authWithPassword('test@example.com', '0123456789');

    const syncedPatients = [];
    const syncedVisits = [];

    // --- Sync Patients with Database-Level Conflict Resolution ---
    for (const patient of changes.patients) {
      const external_id = String(patient.patient_id);
      const {
        given_name, family_name, birthdateEstimated, gender, birthdate, updated_at, created_at
      } = patient;

      const patientData = {
        external_id,
        given_name,
        family_name,
        birthdate_estimated: birthdateEstimated,
        gender,
        birthdate,
        created_at,
        updated_at: updated_at || new Date().toISOString(),
      };

      try {
        // Try to get existing record
        const existing = await pb.collection('patients').getFirstListItem(`external_id="${external_id}"`);
        
        // Only update if incoming record is newer
        if (new Date(patientData.updated_at) > new Date(existing.updated_at)) {
          const updated = await pb.collection('patients').update(existing.id, patientData);
          syncedPatients.push(updated);
        } else {
          // Keep existing record
          syncedPatients.push(existing);
        }
      } catch (err) {
        // Record doesn't exist, create new one
        const created = await pb.collection('patients').create(patientData);
        syncedPatients.push(created);
      }
    }

    // Create patient lookup map
    const patientMap = {};
    const allPatients = await pb.collection('patients').getFullList();
    for (const record of allPatients) {
      patientMap[record.external_id] = record.id;
    }
    
    // --- Sync Visits with Database-Level Conflict Resolution ---
    for (const visit of changes.visits) {
      const external_id = String(visit.visit_id);
      const {
        patient_id, visit_date, visit_start_time, visit_status, visit_step, updated_at, created_at
      } = visit;

      const combinedDateTime = new Date(`${visit_date} ${visit_start_time}:00Z`).toISOString();

      const visitData = {
        external_id,
        patient: patientMap[String(patient_id)],
        visit_date,
        visit_start_time: combinedDateTime,
        visit_status,
        visit_step,
        created_at,
        updated_at: updated_at || new Date().toISOString(),
      };

      try {
        // Try to get existing record
        const existing = await pb.collection('visits').getFirstListItem(`external_id="${external_id}"`);
        
        // Only update if incoming record is newer
        if (new Date(visitData.updated_at) > new Date(existing.updated_at)) {
          const updated = await pb.collection('visits').update(existing.id, visitData);
          syncedVisits.push(updated);
        } else {
          // Keep existing record
          syncedVisits.push(existing);
        }
      } catch (err) {
        // Record doesn't exist, create new one
        const created = await pb.collection('visits').create(visitData);
        syncedVisits.push(created);
      }
    }

    // --- Return ALL current server data ---
    const serverPatients = await pb.collection('patients').getFullList({
      sort: '-updated_at'
    });

    const serverVisits = await pb.collection('visits').getFullList({
      expand: 'patient',
      sort: '-updated_at'
    });
    
    // --- Notify all connected SSE clients ---
    notifySyncComplete({
      patients: serverPatients,
      visits: serverVisits
    });
    
    res.json({
      patients: serverPatients,
      visits: serverVisits,
      serverTime: new Date().toISOString()
    });

  } catch (error) {
    console.error("Sync failed:", error);
    res.status(500).json({ 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

    // --- Create 'patients' collection with unique constraint ---
    if (!existingNames.includes('patients')) {
        await pb.collections.create({
            name: 'patients',
            type: 'base',
            fields: [
                { name: 'given_name', type: 'text', required: true },
                { name: 'family_name', type: 'text' },
                { name: 'birthdate_estimated', type: 'bool' },
                { name: 'external_id', type: 'text', presentable: true },
                { name: 'gender', type: 'text' },
                { name: 'birthdate', type: 'date' },
                { name: 'created_at', type: 'date' },
                { name: 'updated_at', type: 'date' },
            ],
            indexes: [
                'CREATE UNIQUE INDEX idx_patients_external_id ON patients (external_id)'
            ]
        });
        console.log('Created patients collection with unique constraint.');
    } else {
        console.log('Patients collection already exists.');
    }

    // --- Create 'visits' collection with unique constraint ---
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
            indexes: [
                'CREATE UNIQUE INDEX idx_visits_external_id ON visits (external_id)'
            ]
        });
        console.log('Created visits collection with unique constraint.');
    } else {
        console.log('Visits collection already exists.');
    }
}