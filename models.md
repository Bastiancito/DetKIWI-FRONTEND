from datetime import datetime
from app.extensions import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

# --- TABLAS AUXILIARES ---
caso_estudiantes = db.Table('caso_estudiantes',
    db.Column('caso_id', db.Integer, db.ForeignKey('caso.caso_id'), primary_key=True),
    db.Column('estudiante_id', db.Integer, db.ForeignKey('estudiante.estudiante_id'), primary_key=True)
)

# --- MODELOS PRINCIPALES ---

class Rol(db.Model):
    rol_id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)
    descripcion = db.Column(db.String(200))

class User(db.Model, UserMixin):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    rol_id = db.Column(db.Integer, db.ForeignKey('rol.rol_id'), nullable=False)

    def set_password(self, password):
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    def get_id(self):
        return str(self.user_id)

class Reporte(db.Model):
    reporte_id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)
    
    casos = db.relationship('Caso', backref='reporte', lazy=True)

class Caso(db.Model):
    caso_id = db.Column(db.Integer, primary_key=True)
    reporte_id = db.Column(db.Integer, db.ForeignKey('reporte.reporte_id'), nullable=False)
    
    # Datos extraídos del Excel
    similitud = db.Column(db.Float, nullable=False)   # Columna '% de Copia'
    lineas = db.Column(db.Integer, nullable=True)     # Columna 'Lineas Similares'
    url_moss = db.Column(db.String(500), nullable=True) # Columna 'MOSS File'
    
    estado = db.Column(db.String(50), default='Pendiente')
    
    involucrados = db.relationship('Estudiante', secondary=caso_estudiantes, backref='casos')

class Estudiante(db.Model):
    estudiante_id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False)    # Columna 'Nombres'
    apellido = db.Column(db.String(150), nullable=True)   # Columna 'Apellidos'
    rol_usm = db.Column(db.String(20), unique=True, nullable=False) # Columna 'ROL' (Vital)
    codigo_paralelo = db.Column(db.String(50), nullable=True) # Columna 'Paralelo' (ej: IWI131_202)