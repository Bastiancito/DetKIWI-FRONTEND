import React, { useEffect, useState } from 'react';
import { Badge, Button, Table } from 'react-bootstrap';
import type { Caso } from '../../../crud';
import DetallesCaso from './components/DetallesCaso'

interface CasosTableProps {
  casos: Caso[];
  emptyMessage?: string;
  onCasoUpdated?: (casoActualizado: Caso) => void;
}

const CasosTable: React.FC<CasosTableProps> = ({
  casos,
  emptyMessage = 'No hay casos para mostrar.',
  onCasoUpdated,
}) => {
  const [casosList, setCasosList] = useState<Caso[]>(casos);
  const [selectedCaso, setSelectedCaso] = useState<Caso | null>(null);

  useEffect(() => {
    setCasosList(casos);
  }, [casos]);

  if (casosList.length === 0) {
    return <div className="p-4 text-secondary">{emptyMessage}</div>;
  }

  const handleVerDetalles = (caso: Caso) => {
    setSelectedCaso(caso);
  };

  const handleCasoUpdated = (casoActualizado: Caso) => {
    setCasosList((prev) =>
      prev.map((item) =>
        item.caso_id === casoActualizado.caso_id
          ? { ...item, ...casoActualizado }
          : item
      )
    );

    setSelectedCaso((prev) =>
      prev && prev.caso_id === casoActualizado.caso_id
        ? { ...prev, ...casoActualizado }
        : prev
    );

    onCasoUpdated?.(casoActualizado);
  };

  return (
    <>
      <Table responsive hover className="mb-0 align-middle">
        <thead>
          <tr>
            <th>ID Caso</th>
            <th>Similitud</th>
            <th>Lineas</th>
            <th>Estado</th>
            <th>Estudiante 1</th>
            <th>Estudiante 2</th>
            <th>MOSS</th>
            <th>Acciones</th>

          </tr>
        </thead>
        <tbody>
          {casosList.map((caso) => {
            const estudiantes = caso.estudiantes || [];

            return (
              <tr key={caso.caso_id}>
                <td>{caso.caso_id}</td>
                <td>{caso.similitud}%</td>
                <td>{caso.lineas ?? '-'}</td>
                <td>
                  {caso.closed ? (
                    caso.sancion ? (
                      <Badge bg="danger">Sancionado</Badge>

                      ) : (
                      <Badge bg="success">Indultado</Badge>
                    )
                  ) : (
                    <Badge bg="warning" text="dark">Pendiente</Badge>
                  )}
                </td>
                <td>
                  {estudiantes.length > 0
                    ? `${estudiantes[0].nombre} ${estudiantes[0].apellido}`
                    : '-'}
                </td>
                <td>
                  {estudiantes.length > 1
                    ? `${estudiantes[1].nombre} ${estudiantes[1].apellido}`
                    : '-'}
                </td>
                <td>
                  {caso.url_moss ? (
                    <a href={caso.url_moss} target="_blank" rel="noopener noreferrer">
                      Ver en MOSS
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <Button variant="outline-primary" size="sm" onClick={() => handleVerDetalles(caso)}>
                    Ver Detalles
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {selectedCaso && (
        <DetallesCaso
          caso={selectedCaso}
          onCasoUpdated={handleCasoUpdated}
          onClose={() => setSelectedCaso(null)}
        />
      )}
    </>
  );
};

export default CasosTable;