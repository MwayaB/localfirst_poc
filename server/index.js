import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

await pb.collection("_superusers").authWithPassword('test@example.com', '0123456789');

const Token = pb.authStore.token;

const patientsCollection = await pb.collections.create({
    name: 'patients',
    type: 'base',
    fields: [
        {
            name: 'given_name',
            type: 'text',
            required: true,
        },
        {
            name: 'family_name',
            type: 'text',
        },
        {
            name: 'birthdateEstimated',
            type: 'bool',
        },
        {
            name: 'gender',
            type: 'text',
        },
        {
            name: 'created_at',
            type: 'date',
        },
        {
            name: 'updated_at',
            type: 'date',
        },
    ],
});

console.log('created patients collection', patientsCollection);

await pb.collection("_superusers").authWithPassword('test@example.com', '0123456789');

const fetchedPatientsCollection = await pb.collections.getOne('patients');

const visitsCollection = await pb.collections.create({
    name: 'visits',
    type: 'base',
    fields: [
        {
            name: 'patient_id',
            type: 'relation',
            collectionId: fetchedPatientsCollection.id,
            maxSelect: 1
        },
        {
            name: 'visit_date',
            type: 'date',
        },
        {
            name: 'visit_start_time',
            type: 'date',
        },
        {
            name: 'visit_status',
            type: 'text',
        },
        {
            name: 'visit_step',
            type: 'text',
        },
        {
            name: 'created_at',
            type: 'date',
        },
        {
            name: 'updated_at',
            type: 'date',
        },
    ],
    authRule: ""
});

console.log('created visits collection', visitsCollection);
