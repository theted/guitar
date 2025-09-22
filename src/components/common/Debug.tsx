type Props = { data: unknown };

const Debug = ({ data }: Props) => (
  <pre className="debug">{JSON.stringify(data, null, 2)}</pre>
);

export default Debug;
