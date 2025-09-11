import React from 'react';
import { ucFirst } from './helpers';

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  options: readonly string[];
  onChange: (value: string) => void;
};

const Select: React.FC<Props> = ({ options, onChange, ...rest }) => {
  const doChange = ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(value);
  };

  return (
    <select onChange={doChange} {...rest}>
      {options.map((option) => (
        <option value={option} key={option}>
          {ucFirst(option)}
        </option>
      ))}
    </select>
  );
};

export default Select;
