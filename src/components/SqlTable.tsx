import { normalizeValue } from '../../shared/sql-runner'

/** Long results are cut so the page stays fast; the count says how many rows there were. */
const MAX_ROWS = 200

function Cell({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="sql-null">NULL</span>
  return <>{normalizeValue(value)}</>
}

/** A query result, shown the way psql would: columns, rows, and the row count. */
export function SqlTable({ columns, rows }: { columns: string[]; rows: unknown[][] }) {
  const shown = rows.slice(0, MAX_ROWS)
  return (
    <div className="sql-result" data-testid="sql-result">
      <div className="sql-table-wrap">
        <table className="sql-table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, r) => (
              <tr key={r}>
                {row.map((value, c) => (
                  <td key={c}>
                    <Cell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sql-row-count">
        {rows.length === 0 ? 'No rows.' : `${rows.length} row${rows.length === 1 ? '' : 's'}`}
        {rows.length > MAX_ROWS && `, showing the first ${MAX_ROWS}`}
      </p>
    </div>
  )
}
