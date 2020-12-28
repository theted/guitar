const Field = ({
  onChange,
  ...rest
}) => {
  const doChange = ({ target: { value } }) => {
    onChange(value);
  }

  return (
    <input onChange={doChange} {...rest} />
  );
};

export default Field;
