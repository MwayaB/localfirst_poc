import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import PocketBase from 'pocketbase';

const app = express();
const port = 3000;

app.use(bodyParser.json());

const pb = new PocketBase('http://127.0.0.1:8090');

// Authenticate as a user (not admin API)
async function login() {
  try {
    await pb.admins.authWithPassword('test@example.com', '1234567890');
    console.log('Logged in to PocketBase as user');
  } catch (err) {
    console.error('PocketBase login failed:', err);
    process.exit(1);
  }
}

// Ensure collections exist
async function createCollections() {
  const getOrCreateCollection = async (def) => {
    try {
      const existing = await pb.collections.getOne(def.name);
      console.log(`Collection '${def.name}' already exists.`);
      return existing;
    } catch (err) {
      if (err?.status === 404) {
        const created = await pb.collections.create(def);
        console.log(`Collection '${def.name}' created.`);
        return created;
      } else {
        throw err;
      }
    }
  };

  // Define 'patients'
  const patientsDef = {
    name: 'patients',
    type: 'base',
    system: false,
    schema: [
      { name: 'latest_encounter_type', type: 'text', options: {} },
      { name: 'given_name', type: 'text', required: true, options: {} },
      { name: 'family_name', type: 'text', required: true, options: {} },
      { name: 'aetc_visit_number', type: 'text', options: {} },
      { name: 'birthdateEstimated', type: 'bool', defaultValue: false, options: {} },
      { name: 'gender', type: 'text', options: {} },
      { name: 'birthdate', type: 'date', options: {} },
      { name: 'uuid', type: 'text', unique: true, options: {} },
      { name: 'visit_uuid', type: 'text', options: {} },
      { name: 'arrival_time', type: 'date', options: {} },
      { name: 'triage_result', type: 'text', options: {} },
      { name: 'latest_encounter_time', type: 'date', options: {} },
      { name: 'updated_at', type: 'date', required: true, options: {} },
    ],
    options: {},
  };

  const patientsCollection = await getOrCreateCollection(patientsDef);
  console.log(patientsCollection)

  // Define 'visits'
  const visitsDef = {
    name: 'visits',
    type: 'base',
    system: false,
    schema: [
      {
        name: 'patient_id',
        type: 'relation',
        required: true,
        options: {
          collectionId: patientsCollection.id,
          cascadeDelete: false,
        },
      },
      { name: 'visit_date', type: 'date', options: {} },
      { name: 'visit_start_time', type: 'text', options: {} },
      { name: 'visit_status', type: 'text', options: {} },
      { name: 'visit_step', type: 'text', options: {} },
      { name: 'updated_at', type: 'date', required: true, options: {} },
    ],
    options: {},
  };

  await getOrCreateCollection(visitsDef);
}

// Sync endpoint
app.post('/sync', async (req, res) => {
    console.log('Request body:', req.body);
  const { lastSync, changes } = req.body;
  console.log(`Last synced: ${lastSync}`);
  console.table(changes);

  const pushRecords = async (collectionName, records) => {
  if (!records || records.length === 0) return;

  for (const record of records) {
    try {
      // Validation logic
      if (collectionName === 'patients' && !record.uuid) {
        console.error(`Record missing uuid for patients:`, record);
        continue;
      }

      if (collectionName === 'visits' && !record.patient_id) {
        console.error(`Visit record missing patient_id (relation):`, record);
        continue;
      }

      // Try to find existing record (by uuid if available)
      let existing;
      if (record.uuid) {
        try {
          existing = await pb.collection(collectionName).getFirstListItem(`uuid="${record.uuid}"`);
        } catch (err) {
          if (err.status !== 404) throw err;
        }
      }

      if (existing) {
        const localUpdated = new Date(record.updated || record.updated_at || 0);
        const remoteUpdated = new Date(existing.updated);

        if (localUpdated > remoteUpdated) {
          console.log(`Updating ${collectionName} record:`, record.uuid || existing.id);
          await pb.collection(collectionName).update(existing.id, record);
        } else {
          console.log(`Skipping ${collectionName} record (not newer):`, record.uuid || existing.id);
        }
      } else {
        console.log(`Creating new ${collectionName} record:`, record.uuid || '[no uuid]');
        await pb.collection(collectionName).create(record);
      }
    } catch (err) {
      console.error(`Error syncing ${collectionName}:`, err.message);
      if (err.data) {
        console.error('Validation errors:', err.data);
      }
    }
  }
};
  // Push changes to server
  try {
    await pushRecords('patients', changes?.patients || []);
    await pushRecords('visits', changes?.visits || []);
  } catch (err) {
    console.error('Error during push phase:', err);
    return res.status(500).json({ error: 'Sync push failed', details: err.message });
  }

  const pullRecords = async (collectionName) => {
    try {
      if (!lastSync) {
        // If no lastSync, return all records (or limit for initial sync)
        console.log(`No lastSync provided, fetching all ${collectionName} records`);
        return await pb.collection(collectionName).getFullList({
          sort: '-updated' // Get newest first
        });
      }
      
      // Ensure lastSync is in proper ISO format
      const syncDate = new Date(lastSync).toISOString();
      console.log(`Pulling ${collectionName} records updated after: ${syncDate}`);
      
      return await pb.collection(collectionName).getFullList({
        filter: `updated > "${syncDate}"`,
        sort: '-updated'
      });
    } catch (err) {
      console.error(`Error pulling ${collectionName}:`, err.message);
      return [];
    }
  };

  // Pull changes from server
  let patients = [];
  let visits = [];
  
  try {
    patients = await pullRecords('patients');
    visits = await pullRecords('visits');
    
    console.log(`Pulled ${patients.length} patients, ${visits.length} visits`);
  } catch (err) {
    console.error('Error during pull phase:', err);
    return res.status(500).json({ error: 'Sync pull failed', details: err.message });
  }

  // Return successful sync response
  res.json({ 
    patients, 
    visits,
    syncTime: new Date().toISOString(),
    pushedCounts: {
      patients: changes?.patients?.length || 0,
      visits: changes?.visits?.length || 0
    },
    pulledCounts: {
      patients: patients.length,
      visits: visits.length
    }
  });
});

// Start server after login and schema setup
(async () => {
  await login();
  await createCollections();

  app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true 
}));

  app.listen(port, () => {
    console.log(`PocketBase sync server running at http://localhost:${port}`);
  });
})();