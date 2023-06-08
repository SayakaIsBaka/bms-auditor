export default function DifferenceTable(props) {
  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 sm:px-6 lg:px-8">
          <div className="overflow-hidden">
            <table className="min-w-full text-left text-sm font-light">
              <thead className="border-b font-medium dark:border-neutral-500">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Measure
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Lane
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {props.results.map((result) => (
                  <tr className="border-b dark:border-neutral-500" key={result.measure + result.lane + result.note}>
                    <td className="whitespace-nowrap px-6 py-4 font-medium">{result.measure}</td>
                    <td className="whitespace-nowrap px-6 py-4">{result.lane}</td>
                    <td className="whitespace-nowrap px-6 py-4">{result.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
