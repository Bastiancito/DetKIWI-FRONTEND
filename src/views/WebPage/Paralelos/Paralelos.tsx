import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Breadcrumb, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { services } from '../../../crud';
import { toast } from 'react-toastify';
import type { Caso } from '../../../crud';
import type { Paralelo, Usuario } from '../interfaces';
import CasosTable from '../Casos/CasosTable';
import CreateParaleloModal from './components/CreateParaleloModal';
import UpdateParaleloModal from './components/UpdateParaleloModal';

interface ParaleloStatsData {
	paralelo: string;
	paralelo_id: number;
	total_casos: number;
	total_casos_pendientes: number;
	total_casos_resueltos: number;
	usuarios_asignados: Usuario[];
}

interface ParaleloCardItem extends Paralelo {
	total_casos: number;
	total_casos_pendientes: number;
	total_casos_resueltos: number;
	encargados: Usuario[];
}

const Paralelos: React.FC = () => {
	const currentUser = services.auth.getCurrentUser();
	const currentUserId = currentUser?.id ? Number(currentUser.id) : null;
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [paralelosCards, setParalelosCards] = useState<ParaleloCardItem[]>([]);
	const [evaluaciones, setEvaluaciones] = useState<Array<{ evaluacion_id: number; nombre: string }>>([]);
	const [selectedEvaluacionId, setSelectedEvaluacionId] = useState<number | ''>('');
	const [selectedParalelo, setSelectedParalelo] = useState<ParaleloCardItem | null>(null);
	const [casosParalelo, setCasosParalelo] = useState<Caso[]>([]);
	const [loadingCasos, setLoadingCasos] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showUpdateModal, setShowUpdateModal] = useState(false);
	const [selectedParaleloIdForUpdate, setSelectedParaleloIdForUpdate] = useState<number | null>(null);

	const totalParalelos = paralelosCards.length;

	useEffect(() => {
		const loadEvaluaciones = async () => {
			try {
				const response = await services.evaluaciones.listarEvaluaciones();
				if (response.status === 200 && response.data.evaluaciones.length > 0) {
					setEvaluaciones(response.data.evaluaciones);
					setSelectedEvaluacionId(response.data.evaluaciones[0].evaluacion_id);
				}
			} catch {
				toast.error('Error al cargar evaluaciones');
			}
		};

		loadEvaluaciones();
	}, []);

	const loadParalelosWithStats = async () => {
		if (!selectedEvaluacionId) {
			return;
		}

		setLoading(true);
		setError('');

		try {
			const [paralelosResponse, statsResponse] = await Promise.all([
				services.paralelos.getAllParalelos(),
				services.casos.getStatsCasosForParalelosByEvaluacionId(selectedEvaluacionId)
			]);

			const paralelos = paralelosResponse.data as unknown as Paralelo[];
			const statsList = statsResponse.data as unknown as ParaleloStatsData[];

			const statsByParalelo = new Map<number, ParaleloStatsData>();
			statsList.forEach((stats) => {
				statsByParalelo.set(stats.paralelo_id, stats);
			});

			const cardsData: ParaleloCardItem[] = paralelos.map((paralelo) => {
				const stats = statsByParalelo.get(paralelo.paralelo_id);
				return {
					...paralelo,
					total_casos: stats?.total_casos || 0,
					total_casos_pendientes: stats?.total_casos_pendientes || 0,
					total_casos_resueltos: stats?.total_casos_resueltos || 0,
					encargados: stats?.usuarios_asignados || []
				};
			});

			const assignedCards = currentUserId
				? cardsData.filter(
					(paralelo) => paralelo.encargados.some((usuario) => usuario.user_id === currentUserId)
						|| paralelo.usuario?.user_id === currentUserId
				)
				: [];

			setParalelosCards(assignedCards);
		} catch {
			setError('Error al obtener paralelos y estadísticas');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadParalelosWithStats();
	}, [selectedEvaluacionId]);

	useEffect(() => {
		if (paralelosCards.length === 1 && selectedEvaluacionId) {
			const unicoParalelo = paralelosCards[0];
			if (!selectedParalelo || selectedParalelo.paralelo_id !== unicoParalelo.paralelo_id) {
				handleSelectParalelo(unicoParalelo);
			}
		}
	}, [paralelosCards, selectedEvaluacionId]);

	const selectedParaleloSummary = useMemo(() => {
		if (!selectedParalelo) {
			return null;
		}

		return `Paralelo ${selectedParalelo.nombre} · ${selectedParalelo.total_casos} casos`;
	}, [selectedParalelo]);

	const handleSelectParalelo = async (paralelo: ParaleloCardItem) => {
		if (!selectedEvaluacionId) {
			return;
		}

		setSelectedParalelo(paralelo);
		setLoadingCasos(true);
		setError('');

		try {
			const response = await services.casos.getCasosByParaleloIdAndEvaluacionId(
				paralelo.paralelo_id,
				selectedEvaluacionId
			);

			setCasosParalelo(response.data.casos || []);
		} catch {
			setError('Error al obtener casos del paralelo');
			setCasosParalelo([]);
		} finally {
			setLoadingCasos(false);
		}
	};

	const handleParaleloCreated = async () => {
		await loadParalelosWithStats();
		toast.success('Listado de paralelos creado correctamente');
	};

	const handleParaleloUpdated = async () => {
		await loadParalelosWithStats();
		setSelectedParalelo(null);
		setCasosParalelo([]);
		toast.success('Paralelo actualizado correctamente');
	};

	const openUpdateModal = (paraleloId: number) => {
		setSelectedParaleloIdForUpdate(paraleloId);
		setShowUpdateModal(true);
	};

	const renderCard = (paralelo: ParaleloCardItem) => {
		const porcentajeResuelto = paralelo.total_casos === 0
			? '0.0'
			: ((paralelo.total_casos_resueltos / paralelo.total_casos) * 100).toFixed(1);

		return (
			<Col key={paralelo.paralelo_id} xs={12} md={6} lg={4} xl={3}>
				<Card
					className="interactive-card border-0 h-100"
					role="button"
					onClick={() => handleSelectParalelo(paralelo)}
				>
					<Card.Body className="p-3">
						<div className="d-flex justify-content-between align-items-start gap-2 mb-3">
							<div>
								<h3 className="h6 fw-bold mb-1">{paralelo.nombre}</h3>
								<p className="text-secondary small mb-0">{paralelo.sede_nombre || 'Sin sede'}</p>
							</div>
							<Badge bg="info-subtle" text="info-emphasis">Paralelo</Badge>
						</div>

						<div className="small d-flex justify-content-between mb-1">
							<span className="text-secondary">Casos</span>
							<span className="fw-semibold">{paralelo.total_casos}</span>
						</div>
						<div className="small d-flex justify-content-between mb-1">
							<span className="text-secondary">Pendientes</span>
							<span className="fw-semibold text-warning-emphasis">{paralelo.total_casos_pendientes}</span>
						</div>
						<div className="small d-flex justify-content-between mb-1">
							<span className="text-secondary">Resueltos</span>
							<span className="fw-semibold text-success">{paralelo.total_casos_resueltos}</span>
						</div>
						<div className="small d-flex justify-content-between mb-2">
							<span className="text-secondary">% Resuelto</span>
							<span className="fw-semibold">{porcentajeResuelto}%</span>
						</div>

						<div>
							<div className="text-secondary small mb-1">Encargados</div>
							{paralelo.encargados.length === 0 ? (
								<span className="small text-secondary">Sin asignaciones</span>
							) : (
								<div className="d-flex flex-wrap gap-1">
									{paralelo.encargados.map((usuario) => (
										<Badge key={usuario.user_id} bg="light" text="dark" pill className="border">
											{usuario.username}
										</Badge>
									))}
								</div>
							)}
						</div>

						<div className="mt-3 d-grid">
							<Button
								type="button"
								variant="outline-primary"
								size="sm"
								onClick={(event) => {
									event.stopPropagation();
									openUpdateModal(paralelo.paralelo_id);
								}}
							>
								Editar paralelo
							</Button>
						</div>
					</Card.Body>
				</Card>
			</Col>
		);
	};

	return (
		<div className="dashboard-view">
			<Row className="g-4">
				<Col xs={12}>
					<Card className="surface-card page-hero border-0">
						<Card.Body className="p-4 p-lg-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
							<div>
								<span className="badge rounded-pill text-bg-light border px-3 py-2 mb-3">Dashboard</span>
								<h1 className="page-title h2 fw-bold mb-2">Mis casos</h1>
								<p className="text-secondary mb-0">Paralelos a tu cargo para gestionar casos asignados.</p>
							</div>
							<div className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center">
								<Badge bg="primary" pill className="fs-6 px-3 py-2 align-self-start">
									{totalParalelos} a cargo
								</Badge>
								<Button type="button" variant="primary" onClick={() => setShowCreateModal(true)}>
									Crear paralelo
								</Button>
							</div>
						</Card.Body>
					</Card>
				</Col>

				<Col xs={12}>
					<Card className="surface-card border-0">
						<Card.Body className="p-4">
							<Row className="g-3 align-items-end">
								<Col xs={12} md={6} lg={4}>
									<Form.Group controlId="paralelos-evaluacion">
										<Form.Label className="fw-semibold">Evaluación</Form.Label>
										<Form.Select
											value={selectedEvaluacionId}
											onChange={(e) => {
												const evaluacionId = e.target.value ? Number(e.target.value) : '';
												setSelectedEvaluacionId(evaluacionId);
												setSelectedParalelo(null);
												setCasosParalelo([]);
											}}
										>
											{evaluaciones.map((evaluacion) => (
												<option key={evaluacion.evaluacion_id} value={evaluacion.evaluacion_id}>
													{evaluacion.nombre}
												</option>
											))}
										</Form.Select>
									</Form.Group>
								</Col>
								{selectedParalelo && (
									<Col xs={12} md={6} lg={8} className="d-flex justify-content-md-end">
										<div className="d-flex gap-2">
											<Button
												type="button"
												variant="outline-primary"
												onClick={() => openUpdateModal(selectedParalelo.paralelo_id)}
											>
												Editar paralelo
											</Button>
											<Button variant="outline-secondary" onClick={() => setSelectedParalelo(null)}>
												Volver a mis casos
											</Button>
										</div>
									</Col>
								)}
							</Row>
						</Card.Body>
					</Card>
				</Col>

				{error && (
					<Col xs={12}>
						<Alert variant="danger" className="mb-0">{error}</Alert>
					</Col>
				)}

				{!selectedParalelo && (
					<Col xs={12}>
						<Card className="surface-card border-0">
							<Card.Body className="p-3 p-lg-4">
								{loading ? (
									<div className="text-center py-4">
										<Spinner animation="border" />
									</div>
								) : paralelosCards.length === 0 ? (
									<div className="text-secondary">No tienes paralelos asignados para esta evaluacion.</div>
								) : (
									<Row className="g-3">
										{paralelosCards.map(renderCard)}
									</Row>
								)}
							</Card.Body>
						</Card>
					</Col>
				)}

				{selectedParalelo && (
					<Col xs={12}>
						<Card className="surface-card border-0">
							<Card.Body className="py-3 border-bottom">
								<Breadcrumb className="mb-0">
									<Breadcrumb.Item linkAs="button" onClick={() => setSelectedParalelo(null)}>
										Mis casos
									</Breadcrumb.Item>
									<Breadcrumb.Item active>{selectedParalelo.nombre}</Breadcrumb.Item>
								</Breadcrumb>
							</Card.Body>
							<Card.Body className="p-0">
								<div className="p-3 border-bottom bg-body-tertiary small text-secondary">
									{selectedParaleloSummary}
								</div>
								{loadingCasos ? (
									<div className="text-center py-4">
										<Spinner animation="border" />
									</div>
								) : (
									<CasosTable
										casos={casosParalelo}
										emptyMessage="No hay casos para este paralelo en la evaluación seleccionada."
									/>
								)}
							</Card.Body>
						</Card>
					</Col>
				)}
			</Row>

			<CreateParaleloModal
				show={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onParaleloCreated={handleParaleloCreated}
			/>

			<UpdateParaleloModal
				show={showUpdateModal}
				paraleloId={selectedParaleloIdForUpdate}
				onClose={() => {
					setShowUpdateModal(false);
					setSelectedParaleloIdForUpdate(null);
				}}
				onParaleloUpdated={handleParaleloUpdated}
			/>
		</div>
	);
};

export default Paralelos;