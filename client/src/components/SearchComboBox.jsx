import { Field, useField } from 'formik';

const SearchComboBox = ({ name, label, options, multiple = false, sx = {} }) => {
  const [field] = useField(name);
  
  return (
    <div className="form-group" style={sx}>
      <label>{label}</label>
      <Field as="select" name={name} multiple={multiple} className="form-control">
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Field>
    </div>
  );
};

export default SearchComboBox;