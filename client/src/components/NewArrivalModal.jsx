import { Modal } from 'react-bootstrap'; 
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAddVisit } from '../hooks/useVisits';
import { useAddPatient } from '../hooks/usePatients';
import { useServices } from '../hooks/useServices';

const NewArrivalModal = ({ isOpen, onClose }) => {
  const { mutateAsync: addVisit } = useAddVisit();
  const { mutateAsync: addPatient } = useAddPatient();
  const { syncService } = useServices();

      const initialValues = {
        given_name: '',
        family_name: '',
        gender: '',
        birthdate: '',
      };
    
      const validationSchema = Yup.object({
        given_name: Yup.string().required('Required'),
        family_name: Yup.string().required('Required'),
        gender: Yup.string().required('Required'),
        birthdate: Yup.date().required('Required'),
      });
    
      const handleSubmit = async (values, { resetForm }) => {
        const now = new Date();
            try {
                    const patientId = Date.now(); 
 
                    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                    const visitNumber = `${randomLetter}${Math.floor(100 + Math.random() * 900)}`;
                    const patient = {
                        patient_id: patientId,
                        given_name: values.given_name,
                        family_name: values.family_name,
                        birthdateEstimated: 0,
                        gender: values.gender,
                        birthdate: values.birthdate,
                    };

                const visit = {
                    visit_id: visitNumber,
                    patient_id: patientId,
                    visit_date: now.toISOString().split('T')[0],
                    visit_start_time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
                    visit_status: 'active',
                    visit_step: 'registration',
                };

                
                await addPatient([patient]);
                await addVisit([visit]);
                await syncService.sync();
                resetForm();
                onClose();
            } catch (err) {
                console.log('Error registering patient and visit:', err);
                console.error(err);
                alert('Failed to register patient and visit.');
            }
            };
  return (
    <Modal
  show={isOpen}
  onHide={onClose}
  centered
>
  <Modal.Header
    closeButton
    style={{ backgroundColor: '#1a7f37', color: 'white', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}
  >
    <Modal.Title>New Arrival</Modal.Title>
  </Modal.Header>
  <Modal.Body>
          {/* Form content here */}
          <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
                 <Form className="space-y-4">
                        <div className="mb-3">
                            <label className="form-label">Firstname</label>
                            <Field
                            name="given_name"
                            className="form-control"
                            style={{ maxWidth: '300px' }}
                            />
                            <ErrorMessage name="given_name" component="div" className="text-danger small" />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Surname</label>
                            <Field
                            name="family_name"
                            className="form-control"
                            style={{ maxWidth: '300px' }}
                            />
                            <ErrorMessage name="family_name" component="div" className="text-danger small" />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Gender</label>
                            <Field
                            as="select"
                            name="gender"
                            className="form-select"
                            style={{ maxWidth: '300px' }}
                            >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            </Field>
                            <ErrorMessage name="gender" component="div" className="text-danger small" />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Birthdate</label>
                            <Field
                            name="birthdate"
                            type="date"
                            className="form-control"
                            style={{ maxWidth: '300px' }}
                            />
                            <ErrorMessage name="birthdate" component="div" className="text-danger small" />
                        </div>

                        <button type="submit" className="btn btn-contrast mt-3">
                            CREATE
                        </button>
                        </Form>
               </Formik>
      </Modal.Body>
    </Modal>
  );
};

export default NewArrivalModal;