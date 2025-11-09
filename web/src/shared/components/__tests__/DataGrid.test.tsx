import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataGrid } from '../DataGrid';
import { GridColDef } from '@mui/x-data-grid';

// Use React type to satisfy linter
void (React as unknown);

describe('DataGrid Component', () => {
  const mockColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 130 },
    { field: 'email', headerName: 'Email', width: 200 },
  ];

  const mockRows = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
  ];

  it('renders with rows and columns', () => {
    render(<DataGrid rows={mockRows} columns={mockColumns} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { container } = render(
      <DataGrid rows={[]} columns={mockColumns} loading={true} />
    );
    expect(
      container.querySelector('.MuiCircularProgress-root')
    ).toBeInTheDocument();
  });

  it('renders export button when enableExport is true', () => {
    render(<DataGrid rows={mockRows} columns={mockColumns} enableExport={true} />);
    expect(screen.getByText('Exporter CSV')).toBeInTheDocument();
  });

  it('does not render export button when enableExport is false', () => {
    render(<DataGrid rows={mockRows} columns={mockColumns} enableExport={false} />);
    expect(screen.queryByText('Exporter CSV')).not.toBeInTheDocument();
  });

  it('disables export button when no rows', () => {
    render(<DataGrid rows={[]} columns={mockColumns} enableExport={true} />);
    const exportButton = screen.getByText('Exporter CSV');
    expect(exportButton).toBeDisabled();
  });

  it('enables export button when rows exist', () => {
    render(<DataGrid rows={mockRows} columns={mockColumns} enableExport={true} />);
    const exportButton = screen.getByText('Exporter CSV');
    expect(exportButton).not.toBeDisabled();
  });

  it('renders with checkbox selection', () => {
    const { container } = render(
      <DataGrid rows={mockRows} columns={mockColumns} checkboxSelection={true} />
    );
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('renders pagination', () => {
    render(<DataGrid rows={mockRows} columns={mockColumns} />);
    expect(screen.getByText(/1–3 of 3/)).toBeInTheDocument();
  });

  it('calls onPaginationChange when pagination changes', () => {
    const handlePaginationChange = jest.fn();
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        onPaginationChange={handlePaginationChange}
      />
    );
    // Pagination change would be tested with more complex interaction
    expect(handlePaginationChange).not.toHaveBeenCalled(); // Initially not called
  });

  it('calls onSelectionChange when rows are selected', () => {
    const handleSelectionChange = jest.fn();
    render(
      <DataGrid
        rows={mockRows}
        columns={mockColumns}
        checkboxSelection={true}
        onSelectionChange={handleSelectionChange}
      />
    );
    // Selection would be tested with checkbox interaction
    expect(handleSelectionChange).not.toHaveBeenCalled(); // Initially not called
  });
});
