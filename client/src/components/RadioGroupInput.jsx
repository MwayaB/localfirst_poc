import { Field } from 'formik';

const RadioGroupInput = ({ name, label, options }) => (
  <div className="mb-3">
    <label className="form-label d-block">{label}</label>
    {options.map((opt) => (
      <label key={opt.value} className="form-check form-check-inline">
        <Field
          type="radio"
          name={name}
          value={opt.value}
          className="form-check-input"
        />
        {opt.label}
      </label>
    ))}
  </div>
);

export default RadioGroupInput;