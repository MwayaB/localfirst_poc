import { Modal } from 'react-bootstrap';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import RadioGroupInput from './RadioGroupInput';
import SearchComboBox from './SearchComboBox';
import FieldsContainer from './FieldsContainer';
import { concepts, yesno, NO } from '../utils/constants';
import { useUpdateVisitStatus } from '../hooks/useVisits';
import { useSyncMutation } from '../hooks/useSync';
import { now } from '../utils/helpers'



const form = {
  referred: { name: 'referred', label: 'Was the patient referred?' },
  urgent: { name: 'urgent', label: 'Is their condition urgent?' },
  referredTo: { name: 'department', label: 'Refer them to:' },
};

const departments = [
  { label: 'Surgical Ward', value: 'surgical' },
  { label: 'Pediatrics', value: 'pediatrics' },
  { label: 'ICU', value: 'icu' },
];

const initialValues = {
  [form.referred.name]: '',
  [form.urgent.name]: '',
  [form.referredTo.name]: '',
};

const validationSchema = Yup.object({
  [form.referred.name]: Yup.string().required('Required'),
  [form.urgent.name]: Yup.string().required('Required'),
  [form.referredTo.name]: Yup.string().when(form.urgent.name, {
    is: (val) => val === NO,
    then: (schema) => schema.required('Department is required for non-urgent cases'),
    otherwise: (schema) => schema,
  }),
});

const ScreeningModal = ({
  isOpen,
  onClose,
  onSubmit,
  visitId,
    patientId,
}) => {

const { mutateAsync: updateVisitStatus } = useUpdateVisitStatus();
const { mutateAsync: syncNow } = useSyncMutation();

const handleSubmit = async (values, { resetForm }) => {
  try {
  
    if (values.urgent === 'yes') {
      await updateVisitStatus({ visitId, newStatus: 'screened', newStep: 'triage', updated_at: now.toISOString() });
    }

    if (values.urgent === 'no' && values.department) {
      await updateVisitStatus({ visitId, newStatus: 'discharged', updated_at: now.toISOString() });
    }

    await syncNow();
    resetForm();
    onClose();
  } catch (err) {
    console.error('Failed to submit screening:', err);
    alert('Submission failed.');
  }
};

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header
        closeButton
        style={{
          backgroundColor: '#1a7f37',
          color: 'white',
          borderTopLeftRadius: '0.5rem',
          borderTopRightRadius: '0.5rem',
        }}
      >
        <Modal.Title>Screening</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values }) => (
            <Form className="space-y-4">
              <FieldsContainer>
                <RadioGroupInput
                  name={form.referred.name}
                  label={form.referred.label}
                  options={yesno}
                />

                <RadioGroupInput
                  name={form.urgent.name}
                  label={form.urgent.label}
                  options={[...yesno, { label: 'Elective', value: concepts.ELECTIVE }]}
                />
              </FieldsContainer>

              {values[form.urgent.name] === NO && (
                <div className="mb-3">
                  <SearchComboBox
                    name={form.referredTo.name}
                    label={form.referredTo.label}
                    options={departments}
                    multiple={false}
                    sx={{ mr: '1ch' }}
                  />
                  <ErrorMessage name={form.referredTo.name} component="div" className="text-danger small" />
                </div>
              )}

              <button type="submit" className="btn btn-contrast mt-3">
                SUBMIT
              </button>
            </Form>
          )}
        </Formik>
      </Modal.Body>
    </Modal>
  );
};

export default ScreeningModal;