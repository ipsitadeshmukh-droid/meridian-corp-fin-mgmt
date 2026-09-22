import { useMemo, useState } from 'react'
import { IconChevronRight, IconSortAsc, IconSortDesc, IconSortNone, IconGear } from './Icons.jsx'
import { GroupBand, EmptyState } from './Primitives.jsx'
import './DataTable.css'

/* A single table implementation behind every list in the product.
 *
 * columns: { key, label, align, width, sortable, sortValue(row), render(row) }
 * Pass either `rows` or `groups` ([{ id, title, count, total, rows }]).
 */
/* Fixed-width columns are taken out of the flex pool entirely; flexible ones
   carry a minimum so a crowded table scrolls sideways instead of crushing the
   column that identifies the row. */
const cellStyle = (col) => (col.width
  ? { width: col.width, flex: 'none' }
  : { flex: col.flex ?? 1, minWidth: col.minWidth ?? 0 })

export default function DataTable({
  columns,
  rows,
  groups,
  rowKey = (r) => r.id,
  onRowClick,
  initialSort,
  pageSize = 40,
  chevron = false,
  dense = false,
  minWidth,
  empty,
  toolbar,
}) {
  const [sort, setSort] = useState(initialSort ?? null)
  const [limit, setLimit] = useState(pageSize)

  const sorter = useMemo(() => {
    if (!sort) return null
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return null
    const val = col.sortValue ?? ((r) => r[col.key])
    return (a, b) => {
      const av = val(a)
      const bv = val(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sort.dir === 'asc' ? cmp : -cmp
    }
  }, [sort, columns])

  const applySort = (list) => (sorter ? list.slice().sort(sorter) : list)

  const toggleSort = (col) => {
    if (!col.sortable) return
    setSort((s) => {
      if (!s || s.key !== col.key) return { key: col.key, dir: col.defaultDir ?? 'desc' }
      if (s.dir === 'desc') return { key: col.key, dir: 'asc' }
      return null
    })
  }

  const totalRows = groups ? groups.reduce((s, g) => s + g.rows.length, 0) : rows.length
  const isEmpty = totalRows === 0

  const header = (
    <div className="dt-head" role="row">
      {columns.map((col) => {
        const active = sort?.key === col.key
        const Icon = !col.sortable ? null : active ? (sort.dir === 'asc' ? IconSortAsc : IconSortDesc) : IconSortNone
        return (
          <div
            key={col.key}
            role="columnheader"
            className={`dt-cell dt-th${col.align === 'right' ? ' is-right' : ''}${col.sortable ? ' is-sortable' : ''}${active ? ' is-sorted' : ''}`}
            style={cellStyle(col)}
            onClick={() => toggleSort(col)}
          >
            {col.align === 'right' && Icon && <Icon size={13} className="dt-sort-icon" />}
            <span>{col.label}</span>
            {col.align !== 'right' && Icon && <Icon size={13} className="dt-sort-icon" />}
          </div>
        )
      })}
      {chevron && <div className="dt-cell dt-chevron" />}
    </div>
  )

  const renderRow = (row) => (
    <div
      key={rowKey(row)}
      role="row"
      className={`dt-row${onRowClick ? ' is-clickable' : ''}`}
      tabIndex={onRowClick ? 0 : undefined}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row) } } : undefined}
    >
      {columns.map((col) => (
        <div
          key={col.key}
          role="cell"
          className={`dt-cell${col.align === 'right' ? ' is-right' : ''}${col.className ? ' ' + col.className : ''}`}
          style={cellStyle(col)}
        >
          {col.render ? col.render(row) : row[col.key]}
        </div>
      ))}
      {chevron && (
        <div className="dt-cell dt-chevron"><IconChevronRight size={16} /></div>
      )}
    </div>
  )

  return (
    <div className={`dt${dense ? ' is-dense' : ''}`}>
      {toolbar}
      {isEmpty ? (
        empty ?? <EmptyState title="Nothing to show" body="No records match the current filters." />
      ) : groups ? (
        <div className="dt-scroll">
          <div className="dt-track" style={minWidth ? { minWidth } : undefined}>
            {groups.map((g) => (
              <div key={g.id} className="dt-group">
                <GroupBand title={g.title} count={g.count} total={g.total} right={g.right} />
                {header}
                <div className="dt-body">{applySort(g.rows).slice(0, g.limit ?? 50).map(renderRow)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="dt-scroll">
            <div className="dt-track" style={minWidth ? { minWidth } : undefined}>
              {header}
              <div className="dt-body">{applySort(rows).slice(0, limit).map(renderRow)}</div>
            </div>
          </div>
          {rows.length > limit && (
            <div className="dt-more">
              <button className="btn btn-secondary btn-sm" onClick={() => setLimit((l) => l + pageSize)}>
                Show {Math.min(pageSize, rows.length - limit)} more
              </button>
              <span className="u-subtle">{limit} of {rows.length}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function TableToolbar({ children, right }) {
  return (
    <div className="dt-toolbar">
      <div className="dt-toolbar-left">{children}</div>
      <div className="dt-toolbar-right">
        {right}
        <button className="dt-toolbar-icon" aria-label="Column settings"><IconGear size={16} /></button>
      </div>
    </div>
  )
}
