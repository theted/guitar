import { ucFirst } from './helpers';

const Select = ({
  options,
  onChange,
  ...rest
}) => {
  const doChange = ({ target: { value } }) => {
    onChange(value);
  }

  return (
    <select onChange={doChange} {...rest}>
      {options.map(option => (
        <option value={option} key={option}>
          {ucFirst(option)}
        </option>
      ))}
    </select>
  );
};

export default Select;
