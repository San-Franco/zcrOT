import { Skeleton } from '../ui/skeleton'
import { TableBody, TableCell, TableRow } from '../ui/table'

interface TableSkeletonProps {
    cols: number
    rows?: number
}

export default function TableSkeleton({ cols, rows = 10 }: TableSkeletonProps) {
    return (
        <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={`skel-row-${rowIndex}`}>
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <TableCell key={`skel-cell-${rowIndex}-${colIndex}`} className='py-4'>
                            <Skeleton className="w-full h-4 rounded bg-dark-border" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    )
}