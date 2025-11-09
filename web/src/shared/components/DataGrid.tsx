import React from 'react';
import {
  DataGrid as MuiDataGrid,
  GridColDef,
  GridRowsProp,
  GridSortModel,
  GridFilterModel,
  GridPaginationModel,
  GridRowSelectionModel,
  DataGridProps as MuiDataGridProps,
} from '@mui/x-data-grid';
import { Box, Button, styled } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

/**
 * DataGrid props
 */
export interface DataGridProps extends Partial<MuiDataGridProps> {
  rows: GridRowsProp;
  columns: GridColDef[];
  loading?: boolean;
  onSortChange?: (model: GridSortModel) => void;
  onFilterChange?: (model: GridFilterModel) => void;
  onPaginationChange?: (model: GridPaginationModel) => void;
  onSelectionChange?: (selectionModel: GridRowSelectionModel) => void;
  enableExport?: boolean;
  exportFileName?: string;
  checkboxSelection?: boolean;
  disableRowSelectionOnClick?: boolean;
  autoHeight?: boolean;
}

/**
 * Styled components
 */
const DataGridContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  '& .MuiDataGrid-root': {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
  '& .MuiDataGrid-cell:focus': {
    outline: 'none',
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ExportButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

/**
 * Export data to CSV
 */
const exportToCSV = (rows: GridRowsProp, columns: GridColDef[], fileName: string) => {
  // Create CSV header from column definitions
  const header = columns
    .filter((col) => col.field !== '__check__')
    .map((col) => col.headerName || col.field)
    .join(',');

  // Create CSV rows
  const csvRows = rows.map((row) =>
    columns
      .filter((col) => col.field !== '__check__')
      .map((col) => {
        const value = row[col.field];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value ?? '');
        return stringValue.includes(',')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      })
      .join(',')
  );

  // Combine header and rows
  const csv = [header, ...csvRows].join('\n');

  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * DataGrid component
 * A wrapper around Material-UI DataGrid with additional features
 */
export const DataGrid: React.FC<DataGridProps> = ({
  rows,
  columns,
  loading = false,
  onSortChange,
  onFilterChange,
  onPaginationChange,
  onSelectionChange,
  enableExport = false,
  exportFileName = 'export',
  checkboxSelection = false,
  disableRowSelectionOnClick = true,
  autoHeight = false,
  ...rest
}) => {
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    setPaginationModel(model);
    if (onPaginationChange) {
      onPaginationChange(model);
    }
  };

  const handleExport = () => {
    exportToCSV(rows, columns, exportFileName);
  };

  return (
    <DataGridContainer>
      {enableExport && (
        <ExportButton
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={rows.length === 0}
        >
          Exporter CSV
        </ExportButton>
      )}
      <MuiDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        onSortModelChange={onSortChange}
        onFilterModelChange={onFilterChange}
        onRowSelectionModelChange={onSelectionChange}
        autoHeight={autoHeight}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 },
          },
        }}
        sx={{
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'action.hover',
            borderBottom: '2px solid',
            borderColor: 'divider',
          },
        }}
        {...rest}
      />
    </DataGridContainer>
  );
};

export default DataGrid;
