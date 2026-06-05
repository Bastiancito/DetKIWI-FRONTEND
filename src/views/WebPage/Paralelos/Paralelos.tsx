import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Alert, Badge, Breadcrumb, Button, Card, Col, Dropdown, Form, Row, Spinner } from 'react-bootstrap';
import { services, isEvaluacionFueraDePlazo } from '../../../crud';
import { toast } from 'react-toastify';
import type { Caso, Evaluacion } from '../../../crud';
import type { Paralelo, Usuario } from '../interfaces';
import CasosTable from '../Casos/CasosTable';
import CreateParaleloModal from './components/CreateParaleloModal';
import UpdateParaleloModal from './components/UpdateParaleloModal';
import RequireRole from '../../../components/RequireRole';
import { getErrorMessage, isSuccessfulResponse } from '../../../crud/responseHelpers';

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

	// Portal component to render dropdown menu into document.body
	const BodyPortalMenu: React.FC<any> = (props) => {
		const { children, className, style = {}, 'aria-labelledby': ariaLabelledBy, ...rest } = props;
		const menuStyle = {
			// allow Popper to set position/top/left via style, only enforce stacking and sensible sizing
			...style,
			zIndex: 999999,
			minWidth: 'auto',
			width: 'auto',
			maxWidth: '12rem',
			maxHeight: '300px',
			overflowY: 'auto',
			overflowX: 'hidden',
			whiteSpace: 'nowrap'
		} as React.CSSProperties;

		const menu = (
			<div className={className} style={menuStyle} {...rest} aria-labelledby={ariaLabelledBy}>
				{children}
			</div>
		);
		if (typeof document !== 'undefined') {
			return ReactDOM.createPortal(menu, document.body);
		}
		return menu;
	};
	const currentUser = services.auth.getCurrentUser();
	const isProfesor = currentUser?.rol_id === 2;
	const canCreateParalelo = currentUser?.rol_id === 1;
	const currentUserId = currentUser?.id ? Number(currentUser.id) : null;
	const useUserScopedEndpoints = currentUser?.rol_id === 2;
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [paralelosCards, setParalelosCards] = useState<ParaleloCardItem[]>([]);
	const [paralelosSinSede, setParalelosSinSede] = useState<ParaleloCardItem[]>([]);
	const [availableParalelos, setAvailableParalelos] = useState<{ paralelo_id: number; nombre: string }[]>([]);
	const [selectedParaleloIdsFilter, setSelectedParaleloIdsFilter] = useState<number[]>([]);
	const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
	const [selectedEvaluacionId, setSelectedEvaluacionId] = useState<number | ''>('');
	const [selectedParalelo, setSelectedParalelo] = useState<ParaleloCardItem | null>(null);
	const [casosParalelo, setCasosParalelo] = useState<Caso[]>([]);
	const [casosEvaluacion, setCasosEvaluacion] = useState<Caso[]>([]);
	const [viewingAllCasos, setViewingAllCasos] = useState(false);
	const [loadingCasos, setLoadingCasos] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showUpdateModal, setShowUpdateModal] = useState(false);
	const [selectedParaleloIdForUpdate, setSelectedParaleloIdForUpdate] = useState<number | null>(null);
	const selectedEvaluacion = evaluaciones.find((evaluacion) => evaluacion.evaluacion_id === selectedEvaluacionId);
	const selectedEvaluacionFueraDePlazo = isEvaluacionFueraDePlazo(selectedEvaluacion?.fecha_entrega);

	const totalParalelos = paralelosCards.length;

	useEffect(() => {
		const loadEvaluaciones = async () => {
			try {
				const response = await services.evaluaciones.listarEvaluaciones();
				if (response.status === 200) {
					setEvaluaciones(response.data.evaluaciones);
					if (response.data.evaluaciones.length > 0) {
						setSelectedEvaluacionId(response.data.evaluaciones[0].evaluacion_id);
					} else {
						setSelectedEvaluacionId('');
					}
				}
			} catch {
				toast.error('Error al cargar evaluaciones');
			}
		};

		loadEvaluaciones();
	}, []);

    const loadParalelosWithStats = async (): Promise<boolean> => {
		if (!selectedEvaluacionId) {
			return false;
		}

		setLoading(true);
		setError('');

		try {
			const [paralelosResponse, statsResponse] = await Promise.all([
				useUserScopedEndpoints
					? services.paralelos.getParalelosAutenticado()
					: services.paralelos.getAllParalelos(),
				useUserScopedEndpoints
					? services.casos.getStatsCasosForParalelosByEvaluacionIdMisParalelos(selectedEvaluacionId)
					: services.casos.getStatsCasosForParalelosByEvaluacionId(selectedEvaluacionId)
			]);

			if (!isSuccessfulResponse(paralelosResponse) || !isSuccessfulResponse(statsResponse)) {
				throw new Error('Error al obtener paralelos y estadísticas');
			}

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

			// expose available paralelos for admin filter UI
			setAvailableParalelos(cardsData.map((p) => ({ paralelo_id: p.paralelo_id, nombre: p.nombre })));

			const assignedIds = new Set<number>();
			if (currentUserId) {
				cardsData.forEach((par) => {
					if (par.encargados.some((usuario) => usuario.user_id === currentUserId) || par.usuario?.user_id === currentUserId) {
						assignedIds.add(par.paralelo_id);
					}
				});
			}

			setParalelosSinSede(cardsData.filter((paralelo) => !paralelo.sede_id));

			if (useUserScopedEndpoints) {
				setParalelosCards(cardsData);
			} else {
				const assignedCards = cardsData.filter((par) => assignedIds.has(par.paralelo_id));
				const withCasesCards = cardsData.filter((par) => !assignedIds.has(par.paralelo_id) && par.total_casos > 0);
				const withoutCasesCards = cardsData.filter((par) => !assignedIds.has(par.paralelo_id) && par.total_casos === 0);

				setParalelosCards([...assignedCards, ...withCasesCards, ...withoutCasesCards]);
			}
		} catch (error) {
			setError('Error al obtener paralelos y estadísticas');
			return false;
		} finally {
			setLoading(false);
		}

		return true;
	};

	useEffect(() => {
		loadParalelosWithStats();
	}, [selectedEvaluacionId]);

	const toggleParaleloIdFilter = (value: number) => {
		setSelectedParaleloIdsFilter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
	};

	const visibleParalelos = useMemo(() => {
		if (isProfesor) return paralelosCards;
		if (selectedParaleloIdsFilter.length > 0) {
			return paralelosCards.filter((p) => selectedParaleloIdsFilter.includes(p.paralelo_id));
		}
		return paralelosCards;
	}, [paralelosCards, selectedParaleloIdsFilter, isProfesor]);

	const assignedParaleloIds = useMemo(() => {
		const ids = new Set<number>();

		if (!currentUserId) {
			return ids;
		}

		paralelosCards.forEach((par) => {
			if (par.encargados.some((usuario) => usuario.user_id === currentUserId) || par.usuario?.user_id === currentUserId) {
				ids.add(par.paralelo_id);
			}
		});

		return ids;
	}, [paralelosCards, currentUserId]);

	const casosEvaluacionFiltrados = useMemo(() => {
		if (!viewingAllCasos) {
			return [];
		}

		return casosEvaluacion.filter((caso) => {
			const paralelosCaso = caso.paralelos || [];

			if (assignedParaleloIds.size > 0) {
				return paralelosCaso.some((paralelo) => assignedParaleloIds.has(paralelo.paralelo_id));
			}

			return false;
		});
	}, [casosEvaluacion, viewingAllCasos, assignedParaleloIds]);

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

	const loadCasosEvaluacion = async () => {
		if (!selectedEvaluacionId) {
			return;
		}

		setLoadingCasos(true);
		setError('');

		try {
			// When viewing "mis casos" from this view, use the user-scoped endpoint
			const response = await services.casos.getMisCasosByEvaluacionId(selectedEvaluacionId);
			if (response.status === 200) {
				setCasosEvaluacion(response.data.casos || []);
			}
		} catch {
			setError('Error al obtener casos de la evaluacion');
			setCasosEvaluacion([]);
		} finally {
			setLoadingCasos(false);
		}
	};

	const handleParaleloCreated = async () => {
		const ok = await loadParalelosWithStats();
		if (ok) {
			toast.success('Listado de paralelos creado correctamente');
		} else {
			toast.error(getErrorMessage(null, 'Error al crear el listado de paralelos'));
		}
	};

	const handleParaleloUpdated = async () => {
		const ok = await loadParalelosWithStats();
		if (ok) {
			setSelectedParalelo(null);
			setCasosParalelo([]);
			toast.success('Paralelo actualizado correctamente');
		} else {
			toast.error(getErrorMessage(null, 'Error al actualizar el paralelo'));
		}
	};

	const handleVerTodosLosCasos = async () => {
		setViewingAllCasos(true);
		setSelectedParalelo(null);
		setCasosParalelo([]);
		await loadCasosEvaluacion();
	};

	const handleVolverAGrilla = () => {
		setViewingAllCasos(false);
		setCasosEvaluacion([]);
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
								{paralelo.sede_nombre ? (
									<p className="text-secondary small mb-0">{paralelo.sede_nombre}</p>
								) : (
									<Badge bg="warning" text="dark" className="small">Sin sede</Badge>
								)}
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
							<div className="text-secondary small mb-1">Encargado</div>
							{paralelo.usuario?.user_id ? (
								<Badge bg="light" text="dark" pill className="border">
									{paralelo.usuario.username}
								</Badge>
							) : paralelo.encargados.length === 0 ? (
								<span className="small text-secondary">Sin asignaciones</span>
							) : (
								<div className="d-flex flex-wrap gap-1">
									<Badge bg="light" text="dark" pill className="border">
										{paralelo.encargados[0].username}
									</Badge>
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
		<RequireRole allowedRoles={[1,2]}>
		<div className="dashboard-view">
			<Row className="g-4">
				<Col xs={12}>
					<Card className="surface-card page-hero border-0">
						<Card.Body className="p-4 p-lg-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
							<div>
								<span className="badge rounded-pill text-bg-light border px-3 py-2 mb-3">Dashboard</span>
								<h1 className="page-title h2 fw-bold mb-2">Mis casos</h1>
								{selectedEvaluacion && selectedEvaluacionFueraDePlazo && (
									<Badge bg="danger" pill className="fs-6 px-3 py-2">
										La evaluación seleccionada ya venció
									</Badge>
								)}
							</div>
							<div className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center">
								<Badge bg="primary" pill className="fs-6 px-3 py-2 align-self-start">
									{totalParalelos} a cargo
								</Badge>
								{paralelosSinSede.length > 0 && (
									<Badge bg="warning" text="dark" pill className="fs-6 px-3 py-2 align-self-start">
										{paralelosSinSede.length} sin sede
									</Badge>
								)}

								{!isProfesor && selectedParaleloIdsFilter.length > 0 && (
									<Badge bg="secondary" pill className="fs-6 px-3 py-2 align-self-start">
										{selectedParaleloIdsFilter.length} seleccionados
									</Badge>
								)}
							</div>
						</Card.Body>
					</Card>
				</Col>

				<Col xs={12}>
					<Card className="surface-card border-0">
						<Card.Body className="p-4" style={{ overflow: 'visible' }}>
							<Row className="g-3 align-items-end">
								<Col xs={12} md={6} lg={4}>
									<Form.Group controlId="paralelos-evaluacion">
										<div className="d-flex align-items-center justify-content-between gap-2 mb-1 flex-wrap">
											<Form.Label className="fw-semibold mb-0">Evaluación</Form.Label>
											{selectedEvaluacion && selectedEvaluacionFueraDePlazo && (
												<Badge bg="danger" pill>Fuera de plazo</Badge>
											)}
										</div>
										<Form.Select
											value={selectedEvaluacionId}
											onChange={(e) => {
												const evaluacionId = e.target.value ? Number(e.target.value) : '';
												setSelectedEvaluacionId(evaluacionId);
												setSelectedParalelo(null);
												setCasosParalelo([]);
												setViewingAllCasos(false);
												setCasosEvaluacion([]);
											}}
										>
											{evaluaciones.map((evaluacion) => (
												<option key={evaluacion.evaluacion_id} value={evaluacion.evaluacion_id}>
													{evaluacion.nombre}
												</option>
											))}
										</Form.Select>
											{selectedEvaluacion && selectedEvaluacionFueraDePlazo && selectedEvaluacion.fecha_entrega && (
												<div className="small text-danger mt-1">
													Fecha de entrega vencida: {new Date(selectedEvaluacion.fecha_entrega).toLocaleString()}
												</div>
											)}

									</Form.Group>
								</Col>
								{!isProfesor && (
									<Col xs={12} md={6} lg={2}>
										<Form.Group controlId="paralelos-filter-select">
											<Form.Label className="fw-semibold ">Filtrar paralelos</Form.Label>
												<Dropdown autoClose="outside" align="start">
												<Dropdown.Toggle variant="outline-secondary" className="w-100 text-start text-truncate">
													{selectedParaleloIdsFilter.length > 0 ? `Paralelos (${selectedParaleloIdsFilter.length})` : 'Filtrar paralelos'}
												</Dropdown.Toggle>
												<Dropdown.Menu as={BodyPortalMenu} className="p-3" style={{ minWidth: '12rem', maxHeight: '300px', overflowY: 'auto' }}>
													{availableParalelos.length === 0 ? (
														<span className="text-secondary">Sin opciones disponibles</span>
													) : (
														availableParalelos.map((p) => (
															<Form.Check
																key={p.paralelo_id}
																type="checkbox"
																id={`paralelo-filter-${p.paralelo_id}`}
																className="mb-2"
																label={p.nombre}
																checked={selectedParaleloIdsFilter.includes(p.paralelo_id)}
																onClick={(event) => event.stopPropagation()}
																onChange={() => toggleParaleloIdFilter(p.paralelo_id)}
															/>
														))
													)}
												</Dropdown.Menu>
											</Dropdown>
										</Form.Group>
										
									</Col>

								)}
								<Col xs={12} lg="auto" className="ms-lg-auto">
									<div className="d-flex flex-column flex-sm-row flex-wrap justify-content-lg-end gap-2 align-items-start align-items-lg-center">
										{canCreateParalelo && (
											<Button type="button" variant="primary" onClick={() => setShowCreateModal(true)}>
												Crear paralelo
											</Button>
										)}
										<Button type="button" variant="outline-primary" onClick={handleVerTodosLosCasos} disabled={!selectedEvaluacionId}>
											Ver todos mis casos
										</Button>
										{selectedParalelo && (
											<>
												<Button
													type="button"
													variant="primary"
													onClick={() => openUpdateModal(selectedParalelo.paralelo_id)}
												>
													Editar paralelo
												</Button>
												<Button variant="secondary" onClick={() => setSelectedParalelo(null)}>
													Volver a mis casos
												</Button>
											</>
										)}
									</div>
								</Col>
							</Row>
						</Card.Body>
					</Card>
				</Col>

				{error && (
					<Col xs={12}>
						<Alert variant="danger" className="mb-0">{error}</Alert>
					</Col>
				)}

		

				{viewingAllCasos ? (
					<Col xs={12}>
						<Card className="surface-card border-0">
							<Card.Body className="py-3 border-bottom d-flex justify-content-between align-items-center gap-3 flex-wrap">
								<Breadcrumb className="mb-0">
									<Breadcrumb.Item linkAs="button" onClick={handleVolverAGrilla}>
										Mis casos
									</Breadcrumb.Item>
									<Breadcrumb.Item active>Todos los casos</Breadcrumb.Item>
								</Breadcrumb>
								<div className="text-secondary small">
									{casosEvaluacionFiltrados.length} casos visibles
								</div>
							</Card.Body>
							<Card.Body className="p-0">
								<div className="p-3 border-bottom bg-body-tertiary small text-secondary">
									Casos de la evaluación seleccionada{isProfesor ? ' filtrados por tus paralelos vinculados' : ''}.
								</div>
								{loadingCasos ? (
									<div className="text-center py-4">
										<Spinner animation="border" />
									</div>
								) : (
									<CasosTable
										casos={casosEvaluacionFiltrados}
										enableParaleloFilter
										emptyMessage="No hay casos para mostrar en la evaluación seleccionada."
									/>
								)}
							</Card.Body>
						</Card>
					</Col>
				) : !selectedParalelo && (
					<Col xs={12}>
						<Card className="surface-card border-0">
							<Card.Body className="p-3 p-lg-4">
								{loading ? (
									<div className="text-center py-4">
										<Spinner animation="border" />
									</div>
								) : visibleParalelos.length === 0 ? (
									<div className="text-secondary">No tienes paralelos asignados para esta evaluacion.</div>
								) : (
									<Row className="g-3">
										{visibleParalelos.map(renderCard)}
									</Row>
								)}
							</Card.Body>
						</Card>
					</Col>
				)}

				{selectedParalelo && !viewingAllCasos && (
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
		</RequireRole>
	);
};

export default Paralelos;