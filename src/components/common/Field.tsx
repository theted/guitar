import React from 'react';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  onChange: (value: string) => void;
};

const Field: React.FC<Props> = ({ onChange, ...rest }) => {
  const doChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
    onChange(value);
  };

  return <input onChange={doChange} {...rest} />;
};

export default Field;
